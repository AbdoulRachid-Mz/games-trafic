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
  type NewTournamentPhase,
  type PhaseGroup,
  type NewPhaseGroup,
  type PhaseGroupParticipant,
  type NewPhaseGroupParticipant,
  type BracketNode,
  type NewBracketNode,
  type Match,
  type NewMatch,
  editionResults,
} from "@/database/schema";
import {
  eq,
  and,
  or,
  like,
  ilike,
  inArray,
  between,
  desc,
  asc,
  sql,
  count,
  gt,
  lt,
  gte,
  lte,
  isNull,
  isNotNull,
  exists,
  notInArray,
  not,
} from "drizzle-orm";
import {
  type TournamentPhaseFilters,
  type PhaseGroupFilters,
  type PhaseGroupParticipantFilters,
  type BracketNodeFilters,
  type MatchFilters,
  type ListQuery,
  type PaginationResponse,
  type QueryOptions,
} from "@/types/api";
import { db } from "@/lib/db";
import {
  generateGroupMatches,
  generateRoundRobinMatches,
} from "@/lib/tournaments/match.generator";
import { revalidatePath } from "next/cache";
import {
  shuffle,
  chunk,
  getDefaultScheduledTime,
} from "@/lib/tournaments/utils";

/**
 * Organise la structure complète d'une édition
 * CORRIGÉ : Supporte la création de multiples nœuds par groupe (journées pour ROUND_ROBIN)
 */
import { createStructureEngine } from "@/lib/tournaments/structure-engine";
import { generateMatchesEngine } from "@/lib/tournaments/match-generation-engine";
import { propagatePhaseResults } from "@/lib/tournaments/propagation-service";
import {
  computeWinner,
  getRequiredWins,
  resolveSlotIndex,
  computeAggregatedWinner,
} from "@/lib/tournaments/bracket-engine";

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère une phase de tournoi par son ID avec relations optionnelles
 */
export async function getTournamentPhaseById(
  id: string,
  options?: { populate?: string[] },
): Promise<TournamentPhase | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.tournamentPhases.findFirst({
        where: (tournamentPhases, { eq }) => eq(tournamentPhases.id, id),
        with: {
          edition: options.populate.includes("edition") ? true : undefined,
          groups: options.populate.includes("groups") ? true : undefined,
          bracketNodes: options.populate.includes("bracketNodes")
            ? true
            : undefined,
          matches: options.populate.includes("matches") ? true : undefined,
        },
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(tournamentPhases)
      .where(eq(tournamentPhases.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Error getting tournament phase by ID:", error);
    throw new Error("Failed to fetch tournament phase");
  }
}

/**
 * Liste les phases d'une édition avec pagination, filtres et options
 */
export async function getTournamentPhases(
  query: ListQuery<TournamentPhaseFilters> = {},
): Promise<PaginationResponse<TournamentPhase>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    // Build where conditions safely
    let whereConditions;
    try {
      whereConditions = buildTournamentPhaseWhereConditions(filters, options);
    } catch (buildError) {
      console.error("Error building where conditions:", buildError);
      // Fallback to a safe default condition
      whereConditions = eq(tournamentPhases.isDeleted, false);
    }

    // Execute queries with error handling
    let phasesData: TournamentPhase[] = [];
    let total = 0;

    try {
      const phasesQuery = db
        .select()
        .from(tournamentPhases)
        .where(whereConditions)
        .limit(pagination.limit)
        .offset(offset);

      if (options.sortBy) {
        const sortField = options.sortBy as keyof TournamentPhase;
        const sortOrder = options.sortOrder === "desc" ? desc : asc;
        phasesQuery.orderBy(sortOrder(tournamentPhases[sortField]));
      } else {
        phasesQuery.orderBy(asc(tournamentPhases.order));
      }

      const countQuery = db
        .select({ count: count() })
        .from(tournamentPhases)
        .where(whereConditions);

      const [phasesResult, countResult] = await Promise.all([
        phasesQuery.execute().catch((err) => {
          console.error("Phases query failed:", err);
          return [];
        }),
        countQuery.execute().catch((err) => {
          console.error("Count query failed:", err);
          return [{ count: 0 }];
        }),
      ]);

      phasesData = phasesResult;
      total = countResult[0]?.count ?? 0;
    } catch (queryError) {
      console.error("Database query error:", queryError);
      // Return empty result on query failure
      return {
        data: [],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: phasesData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting tournament phases:", error);
    throw new Error("Failed to fetch tournament phases");
  }
}
/**
 * Récupère les statistiques des phases de tournoi
 */
export async function getTournamentPhaseStats(
  filters?: TournamentPhaseFilters,
) {
  try {
    const whereConditions = buildTournamentPhaseWhereConditions(filters || {});

    const [totalResult, activeResult, completedResult] = await Promise.all([
      db
        .select({ count: count() })
        .from(tournamentPhases)
        .where(whereConditions),
      db
        .select({ count: count() })
        .from(tournamentPhases)
        .where(and(whereConditions, eq(tournamentPhases.isActive, true))),
      db
        .select({ count: count() })
        .from(tournamentPhases)
        .where(and(whereConditions, eq(tournamentPhases.isCompleted, true))),
    ]);

    return {
      total: totalResult[0]?.count ?? 0,
      active: activeResult[0]?.count ?? 0,
      completed: completedResult[0]?.count ?? 0,
    };
  } catch (error) {
    console.error("Error getting tournament phase stats:", error);
    throw new Error("Failed to fetch tournament phase statistics");
  }
}

// ============================================================================
// GROUPES DE PHASES
// ============================================================================

/**
 * Récupère un groupe de phase par son ID
 */
export async function getPhaseGroupById(
  id: string,
  options?: { populate?: string[] },
): Promise<PhaseGroup | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.phaseGroups.findFirst({
        where: (phaseGroups, { eq }) => eq(phaseGroups.id, id),
        with: {
          phase: options.populate.includes("phase") ? true : undefined,
          participants: options.populate.includes("participants")
            ? true
            : undefined,
          bracketNodes: options.populate.includes("bracketNodes")
            ? true
            : undefined,
        },
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(phaseGroups)
      .where(eq(phaseGroups.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Error getting phase group by ID:", error);
    throw new Error("Failed to fetch phase group");
  }
}

/**
 * Liste les groupes d'une phase avec pagination et filtres
 */
export async function getPhaseGroups(
  query: ListQuery<PhaseGroupFilters> = {},
): Promise<PaginationResponse<PhaseGroup>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildPhaseGroupWhereConditions(filters, options);

    const groupsQuery = db
      .select()
      .from(phaseGroups)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof PhaseGroup;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      groupsQuery.orderBy(sortOrder(phaseGroups[sortField]));
    } else {
      groupsQuery.orderBy(asc(phaseGroups.order));
    }

    const countQuery = db
      .select({ count: count() })
      .from(phaseGroups)
      .where(whereConditions);

    const [groupsData, totalResult] = await Promise.all([
      groupsQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: groupsData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting phase groups:", error);
    throw new Error("Failed to fetch phase groups");
  }
}

// ============================================================================
// PARTICIPANTS DE GROUPE
// ============================================================================

/**
 * Récupère un participant de groupe par son ID
 */
export async function getPhaseGroupParticipantById(
  id: string,
  options?: { populate?: string[] },
): Promise<PhaseGroupParticipant | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.phaseGroupParticipants.findFirst({
        where: (phaseGroupParticipants, { eq }) =>
          eq(phaseGroupParticipants.id, id),
        with: {
          group: options.populate.includes("group") ? true : undefined,
          registration: options.populate.includes("registration")
            ? {
                with: {
                  member: options.populate.includes("member")
                    ? true
                    : undefined,
                  edition: options.populate.includes("edition")
                    ? true
                    : undefined,
                },
              }
            : undefined,
        },
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(phaseGroupParticipants)
      .where(eq(phaseGroupParticipants.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Error getting phase group participant by ID:", error);
    throw new Error("Failed to fetch phase group participant");
  }
}

/**
 * Supprime un participant de groupe par son ID et recalcule les classements.
 */
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
export async function getPhaseGroupParticipants(
  query: ListQuery<PhaseGroupParticipantFilters> = {},
): Promise<PaginationResponse<PhaseGroupParticipant>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildPhaseGroupParticipantWhereConditions(
      filters,
      options,
    );

    const participantsQuery = db
      .select()
      .from(phaseGroupParticipants)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof PhaseGroupParticipant;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      participantsQuery.orderBy(sortOrder(phaseGroupParticipants[sortField]));
    } else {
      participantsQuery.orderBy(desc(phaseGroupParticipants.points));
    }

    const countQuery = db
      .select({ count: count() })
      .from(phaseGroupParticipants)
      .where(whereConditions);

    const [participantsData, totalResult] = await Promise.all([
      participantsQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: participantsData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting phase group participants:", error);
    throw new Error("Failed to fetch phase group participants");
  }
}

/**
 * Récupère les classements complets d'une phase (groupes + participants calculés)
 * Utilisé par EditionStandingsTab pour un affichage performant
 */
export async function getPhaseStandings(phaseId: string) {
  try {
    const groupsWithParticipants = await db.query.phaseGroups.findMany({
      where: and(
        eq(phaseGroups.phaseId, phaseId),
        eq(phaseGroups.isDeleted, false),
      ),
      orderBy: [asc(phaseGroups.order)],
      with: {
        participants: {
          orderBy: [
            desc(phaseGroupParticipants.points),
            asc(phaseGroupParticipants.position),
          ],
          with: {
            registration: {
              with: {
                member: {
                  with: {
                    user: {
                      columns: {
                        id: true,
                        username: true,
                        fullName: true,
                        profileImage: true,
                        image: true,
                      },
                    },
                    team: {
                      columns: { id: true, name: true, logo: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return groupsWithParticipants.map((group) => ({
      groupId: group.id,
      groupName: group.name,
      rows: (group.participants || []).map((p) => ({
        id: p.id,
        registrationId: p.registrationId,
        points: p.points ?? 0,
        matchesPlayed: p.matchesPlayed ?? 0,
        matchesWon: p.matchesWon ?? 0,
        matchesDrawn: p.matchesDrawn ?? 0,
        matchesLost: p.matchesLost ?? 0,
        scoreFor: p.scoreFor ?? 0,
        scoreAgainst: p.scoreAgainst ?? 0,
        scoreDifference: (p.scoreFor ?? 0) - (p.scoreAgainst ?? 0),
        position: p.position ?? undefined,
        qualified: p.qualified ?? false,
        displayName:
          p.registration?.member?.user?.username ||
          p.registration?.member?.user?.fullName ||
          "Anonyme",
        avatar:
          p.registration?.member?.user?.profileImage ||
          p.registration?.member?.user?.image,
        teamName: p.registration?.member?.team?.name,
        teamLogo: p.registration?.member?.team?.logo,
      })),
    }));
  } catch (error) {
    console.error("Error fetching phase standings:", error);
    throw error;
  }
}

// ============================================================================
// NŒUDS DE BRACKET
// ============================================================================

/**
 * Récupère un nœud de bracket par son ID
 */
export async function getBracketNodeById(
  id: string,
  options?: { populate?: string[] },
): Promise<BracketNode | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.bracketNodes.findFirst({
        where: (bracketNodes, { eq }) => eq(bracketNodes.id, id),
        with: {
          phase: options.populate.includes("phase") ? true : undefined,
          group: options.populate.includes("group") ? true : undefined,
          parentNode: options.populate.includes("parentNode")
            ? true
            : undefined,
          childNodes: options.populate.includes("childNodes")
            ? true
            : undefined,
          matches: options.populate.includes("match") ? true : undefined,
        },
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(bracketNodes)
      .where(eq(bracketNodes.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Error getting bracket node by ID:", error);
    throw new Error("Failed to fetch bracket node");
  }
}

/**
 * Liste les nœuds de bracket d'une phase avec pagination et filtres
 */
export async function getBracketNodes(
  query: ListQuery<BracketNodeFilters> = {},
): Promise<PaginationResponse<BracketNode>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildBracketNodeWhereConditions(filters, options);

    const nodesQuery = db
      .select()
      .from(bracketNodes)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof BracketNode;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      nodesQuery.orderBy(sortOrder(bracketNodes[sortField]));
    } else {
      nodesQuery.orderBy(asc(bracketNodes.order));
    }

    const countQuery = db
      .select({ count: count() })
      .from(bracketNodes)
      .where(whereConditions);

    const [nodesData, totalResult] = await Promise.all([
      nodesQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: nodesData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting bracket nodes:", error);
    throw new Error("Failed to fetch bracket nodes");
  }
}

// ============================================================================
// MATCHS
// ============================================================================

/**
 * Récupère un match par son ID
 */
/**
 * Récupère un match par son ID avec toutes les relations nécessaires
 */
export async function getMatchById(
  id: string,
  options?: { populate?: string[] },
): Promise<Match | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.matches.findFirst({
        where: (matches, { eq }) => eq(matches.id, id),
        with: {
          edition: options.populate.includes("edition")
            ? {
                with: {
                  tournament: {
                    with: {
                      members: {
                        where: (members, { eq }) =>
                          eq(members.isDeleted, false),
                        columns: {
                          id: true,
                          userId: true,
                          role: true,
                          isCoOrganizer: true,
                        },
                      },
                    },
                  },
                },
              }
            : undefined,
          phase: options.populate.includes("phase") ? true : undefined,
          group: options.populate.includes("group") ? true : undefined,
          bracketNode: options.populate.includes("bracketNode")
            ? true
            : undefined,
          participant1: options.populate.includes("participant1")
            ? {
                with: {
                  member: options.populate.includes("member1")
                    ? {
                        with: {
                          user: {
                            columns: {
                              id: true,
                              username: true,
                              fullName: true,
                              profileImage: true,
                              image: true,
                            },
                          },
                          team: {
                            columns: { id: true, name: true, logo: true },
                          },
                        },
                      }
                    : undefined,
                },
              }
            : undefined,
          participant2: options.populate.includes("participant2")
            ? {
                with: {
                  member: options.populate.includes("member2")
                    ? {
                        with: {
                          user: {
                            columns: {
                              id: true,
                              username: true,
                              fullName: true,
                              profileImage: true,
                              image: true,
                            },
                          },
                          team: {
                            columns: { id: true, name: true, logo: true },
                          },
                        },
                      }
                    : undefined,
                },
              }
            : undefined,
          winner: options.populate.includes("winner")
            ? {
                with: {
                  member: options.populate.includes("winnerMember")
                    ? true
                    : undefined,
                },
              }
            : undefined,
          loser: options.populate.includes("loser")
            ? {
                with: {
                  member: options.populate.includes("loserMember")
                    ? true
                    : undefined,
                },
              }
            : undefined,
          submittedBy: options.populate.includes("submittedBy")
            ? true
            : undefined,
          resolvedBy: options.populate.includes("resolvedBy")
            ? true
            : undefined,
        },
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(matches)
      .where(eq(matches.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Error getting match by ID:", error);
    throw new Error("Failed to fetch match");
  }
}

/**
 * Liste les matchs avec pagination et filtres
 */
export async function getMatches(
  query: ListQuery<MatchFilters> = {},
): Promise<PaginationResponse<Match>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildMatchWhereConditions(filters, options);

    const matchesQuery = db
      .select()
      .from(matches)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof Match;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      matchesQuery.orderBy(sortOrder(matches[sortField]));
    } else {
      matchesQuery.orderBy(asc(matches.scheduledTime));
    }

    const countQuery = db
      .select({ count: count() })
      .from(matches)
      .where(whereConditions);

    const [matchesData, totalResult] = await Promise.all([
      matchesQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: matchesData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting matches:", error);
    throw new Error("Failed to fetch matches");
  }
}

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
export async function getMatchesWithParticipants(
  query: ListQuery<MatchFilters> = {},
): Promise<PaginationResponse<any>> {
  try {
    const {
      pagination = { page: 1, limit: 20 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildMatchWhereConditions(filters, options);

    const matchesData = await db.query.matches.findMany({
      where: whereConditions,
      limit: pagination.limit,
      offset,
      orderBy:
        options.sortBy === "scheduledTime"
          ? [asc(matches.scheduledTime)]
          : options.sortBy === "createdAt"
            ? [desc(matches.createdAt)]
            : [asc(matches.scheduledTime)],
      with: {
        participant1: {
          with: {
            member: {
              with: {
                user: {
                  columns: {
                    id: true,
                    username: true,
                    fullName: true,
                    profileImage: true,
                    image: true,
                  },
                },
                team: { columns: { id: true, name: true, logo: true } },
              },
            },
          },
        },
        participant2: {
          with: {
            member: {
              with: {
                user: {
                  columns: {
                    id: true,
                    username: true,
                    fullName: true,
                    profileImage: true,
                    image: true,
                  },
                },
                team: { columns: { id: true, name: true, logo: true } },
              },
            },
          },
        },
        phase: { columns: { id: true, name: true, phaseType: true } },
        group: { columns: { id: true, name: true } },
      },
    });

    const countResult = await db
      .select({ count: count() })
      .from(matches)
      .where(whereConditions);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: matchesData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting matches with participants:", error);
    throw new Error("Failed to fetch matches with participants");
  }
}

/**
 * Récupère les 10 matchs les plus pertinents pour le carrousel du header
 * (Derniers matchs joués ou prochains matchs prévus)
 */
export async function getEditionRecentMatches(editionId: string) {
  try {
    const matchesData = await db.query.matches.findMany({
      where: and(
        eq(matches.editionId, editionId),
        eq(matches.isDeleted, false),
      ),
      limit: 10,
      orderBy: [desc(matches.scheduledTime), desc(matches.createdAt)],
      with: {
        participant1: {
          with: {
            member: {
              with: {
                user: {
                  columns: { username: true, profileImage: true, image: true },
                },
                team: { columns: { name: true, logo: true } },
              },
            },
          },
        },
        participant2: {
          with: {
            member: {
              with: {
                user: {
                  columns: { username: true, profileImage: true, image: true },
                },
                team: { columns: { name: true, logo: true } },
              },
            },
          },
        },
        phase: { columns: { name: true } },
      },
    });

    return matchesData;
  } catch (error) {
    console.error("Error getting recent matches:", error);
    return [];
  }
}

/**
 * Stats rapides pour les matchs d'une édition
 */
export async function getEditionMatchStats(editionId: string): Promise<{
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  disputed: number;
}> {
  try {
    const [totalRes, completedRes, inProgressRes, disputedRes] =
      await Promise.all([
        db
          .select({ count: count() })
          .from(matches)
          .where(
            and(eq(matches.editionId, editionId), eq(matches.isDeleted, false)),
          ),
        db
          .select({ count: count() })
          .from(matches)
          .where(
            and(
              eq(matches.editionId, editionId),
              eq(matches.status, "COMPLETED"),
              eq(matches.isDeleted, false),
            ),
          ),
        db
          .select({ count: count() })
          .from(matches)
          .where(
            and(
              eq(matches.editionId, editionId),
              eq(matches.status, "IN_PROGRESS"),
              eq(matches.isDeleted, false),
            ),
          ),
        db
          .select({ count: count() })
          .from(matches)
          .where(
            and(
              eq(matches.editionId, editionId),
              eq(matches.status, "DISPUTED"),
              eq(matches.isDeleted, false),
            ),
          ),
      ]);

    const total = totalRes[0]?.count ?? 0;
    const completed = completedRes[0]?.count ?? 0;
    const inProgress = inProgressRes[0]?.count ?? 0;
    const disputed = disputedRes[0]?.count ?? 0;

    return {
      total,
      completed,
      inProgress,
      pending: total - completed - inProgress - disputed,
      disputed,
    };
  } catch (error) {
    console.error("Error getting edition match stats:", error);
    throw new Error("Failed to fetch edition match stats");
  }
}

/**
 * Vérifier la capacité d'un groupe (participants actuels vs max configuré)
 */
export async function checkGroupCapacity(groupId: string): Promise<{
  current: number;
  max: number | null;
  isFull: boolean;
}> {
  try {
    const group = await db.query.phaseGroups.findFirst({
      where: eq(phaseGroups.id, groupId),
      with: { participants: true },
    });
    if (!group) throw new Error("Groupe introuvable");

    const config = (group.config as any) || {};
    const max: number | null = config.maxParticipants ?? null;
    const current = group.participants.length;

    return { current, max, isFull: max !== null && current >= max };
  } catch (error) {
    console.error("Error checking group capacity:", error);
    throw error;
  }
}

/**
 * Générer les matchs depuis un bracket node (config.participants = registrationIds[])
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
 */
export async function bulkCreateTournamentPhases(
  phasesData: NewTournamentPhase[],
): Promise<TournamentPhase[]> {
  try {
    if (phasesData.length === 0) return [];

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
 */
export async function updateTournamentPhase(
  id: string,
  phaseData: Partial<NewTournamentPhase>,
): Promise<TournamentPhase> {
  try {
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
 */
export async function deleteTournamentPhase(
  id: string,
): Promise<TournamentPhase> {
  try {
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
      if (updatedMatch.groupId) {
        await recalculateGroupStandings(updatedMatch.groupId);
      }
      // Prochaine étape : Propagation automatique vers le bracket (Node) si applicable
      if (updatedMatch.bracketNodeId) {
        // Logique de progression vers le parent du bracket
      }
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
function buildTournamentPhaseWhereConditions(
  filters: TournamentPhaseFilters,
  options: QueryOptions = {},
) {
  const conditions = [];

  if (!options.includeDeleted) {
    conditions.push(eq(tournamentPhases.isDeleted, false));
  }

  if (filters.editionId) {
    conditions.push(eq(tournamentPhases.editionId, filters.editionId));
  }
  if (filters.name) {
    conditions.push(ilike(tournamentPhases.name, `%${filters.name}%`));
  }
  if (filters.phaseType && filters.phaseType.length > 0) {
    conditions.push(inArray(tournamentPhases.phaseType, filters.phaseType));
  }
  if (typeof filters.isActive === "boolean") {
    conditions.push(eq(tournamentPhases.isActive, filters.isActive));
  }
  if (typeof filters.isCompleted === "boolean") {
    conditions.push(eq(tournamentPhases.isCompleted, filters.isCompleted));
  }
  if (typeof filters.isDoubleElimination === "boolean") {
    conditions.push(
      eq(tournamentPhases.isDoubleElimination, filters.isDoubleElimination),
    );
  }
  if (typeof filters.isHidden === "boolean") {
    conditions.push(eq(tournamentPhases.isHidden, filters.isHidden));
  }
  if (filters.orderMin !== undefined) {
    conditions.push(gte(tournamentPhases.order, filters.orderMin));
  }
  if (filters.orderMax !== undefined) {
    conditions.push(lte(tournamentPhases.order, filters.orderMax));
  }
  if (filters.scheduledStartFrom) {
    conditions.push(
      gte(
        tournamentPhases.scheduledStart,
        new Date(filters.scheduledStartFrom),
      ),
    );
  }
  if (filters.scheduledStartTo) {
    conditions.push(
      lte(tournamentPhases.scheduledStart, new Date(filters.scheduledStartTo)),
    );
  }
  if (filters.scheduledEndFrom) {
    conditions.push(
      gte(tournamentPhases.scheduledEnd, new Date(filters.scheduledEndFrom)),
    );
  }
  if (filters.scheduledEndTo) {
    conditions.push(
      lte(tournamentPhases.scheduledEnd, new Date(filters.scheduledEndTo)),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les groupes de phase
 */
function buildPhaseGroupWhereConditions(
  filters: PhaseGroupFilters,
  options: QueryOptions = {},
) {
  const conditions = [];

  if (!options.includeDeleted) {
    conditions.push(eq(phaseGroups.isDeleted, false));
  }

  if (filters.phaseId) {
    conditions.push(eq(phaseGroups.phaseId, filters.phaseId));
  }
  if (filters.name) {
    conditions.push(ilike(phaseGroups.name, `%${filters.name}%`));
  }
  if (filters.groupType) {
    if (Array.isArray(filters.groupType)) {
      conditions.push(inArray(phaseGroups.groupType, filters.groupType));
    } else {
      conditions.push(eq(phaseGroups.groupType, filters.groupType));
    }
  }
  if (typeof filters.isCompleted === "boolean") {
    conditions.push(eq(phaseGroups.isCompleted, filters.isCompleted));
  }
  if (typeof filters.isLocked === "boolean") {
    conditions.push(eq(phaseGroups.isLocked, filters.isLocked));
  }
  if (filters.orderMin !== undefined) {
    conditions.push(gte(phaseGroups.order, filters.orderMin));
  }
  if (filters.orderMax !== undefined) {
    conditions.push(lte(phaseGroups.order, filters.orderMax));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les participants de groupe
 */
function buildPhaseGroupParticipantWhereConditions(
  filters: PhaseGroupParticipantFilters,
  options: QueryOptions = {},
) {
  const conditions = [];

  if (!options.includeDeleted) {
    conditions.push(eq(phaseGroupParticipants.isDeleted, false));
  }

  if (filters.groupId) {
    conditions.push(eq(phaseGroupParticipants.groupId, filters.groupId));
  }
  if (filters.phaseId) {
    const groupIdsForPhase = db
      .select({ id: phaseGroups.id })
      .from(phaseGroups)
      .where(eq(phaseGroups.phaseId, filters.phaseId));
    conditions.push(inArray(phaseGroupParticipants.groupId, groupIdsForPhase));
  }
  if (filters.registrationId) {
    conditions.push(
      eq(phaseGroupParticipants.registrationId, filters.registrationId),
    );
  }
  if (filters.qualified !== undefined) {
    conditions.push(eq(phaseGroupParticipants.qualified, filters.qualified));
  }
  if (filters.positionMin !== undefined) {
    conditions.push(gte(phaseGroupParticipants.position, filters.positionMin));
  }
  if (filters.positionMax !== undefined) {
    conditions.push(lte(phaseGroupParticipants.position, filters.positionMax));
  }
  if (filters.pointsMin !== undefined) {
    conditions.push(gte(phaseGroupParticipants.points, filters.pointsMin));
  }
  if (filters.pointsMax !== undefined) {
    conditions.push(lte(phaseGroupParticipants.points, filters.pointsMax));
  }
  if (filters.matchesPlayedMin !== undefined) {
    conditions.push(
      gte(phaseGroupParticipants.matchesPlayed, filters.matchesPlayedMin),
    );
  }
  if (filters.matchesPlayedMax !== undefined) {
    conditions.push(
      lte(phaseGroupParticipants.matchesPlayed, filters.matchesPlayedMax),
    );
  }
  if (filters.matchesWonMin !== undefined) {
    conditions.push(
      gte(phaseGroupParticipants.matchesWon, filters.matchesWonMin),
    );
  }
  if (filters.matchesWonMax !== undefined) {
    conditions.push(
      lte(phaseGroupParticipants.matchesWon, filters.matchesWonMax),
    );
  }
  if (filters.isSeeded !== undefined) {
    conditions.push(eq(phaseGroupParticipants.isSeeded, filters.isSeeded));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les nœuds de bracket
 */
function buildBracketNodeWhereConditions(
  filters: BracketNodeFilters,
  options: QueryOptions = {},
) {
  const conditions = [];

  if (!options.includeDeleted) {
    conditions.push(eq(bracketNodes.isDeleted, false));
  }

  if (filters.phaseId) {
    conditions.push(eq(bracketNodes.phaseId, filters.phaseId));
  }
  if (filters.groupId) {
    conditions.push(eq(bracketNodes.groupId, filters.groupId));
  }
  if (filters.nodeType) {
    if (Array.isArray(filters.nodeType)) {
      conditions.push(inArray(bracketNodes.nodeType, filters.nodeType));
    } else {
      conditions.push(eq(bracketNodes.nodeType, filters.nodeType));
    }
  }
  if (filters.nodeCode) {
    conditions.push(eq(bracketNodes.nodeCode, filters.nodeCode));
  }
  if (filters.parentNodeId) {
    conditions.push(eq(bracketNodes.parentNodeId, filters.parentNodeId));
  }
  if (filters.bracketType) {
    if (Array.isArray(filters.bracketType)) {
      conditions.push(inArray(bracketNodes.bracketType, filters.bracketType));
    } else {
      conditions.push(eq(bracketNodes.bracketType, filters.bracketType));
    }
  }
  if (filters.roundMin !== undefined) {
    conditions.push(gte(bracketNodes.round, filters.roundMin));
  }
  if (filters.roundMax !== undefined) {
    conditions.push(lte(bracketNodes.round, filters.roundMax));
  }
  if (filters.matchNumberMin !== undefined) {
    conditions.push(gte(bracketNodes.matchNumber, filters.matchNumberMin));
  }
  if (filters.matchNumberMax !== undefined) {
    conditions.push(lte(bracketNodes.matchNumber, filters.matchNumberMax));
  }
  if (filters.depthMin !== undefined) {
    conditions.push(gte(bracketNodes.depth, filters.depthMin));
  }
  if (filters.depthMax !== undefined) {
    conditions.push(lte(bracketNodes.depth, filters.depthMax));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les matchs
 */
function buildMatchWhereConditions(
  filters: MatchFilters = {},
  options: any = {},
) {
  const conditions = [];

  // 🔒 obligatoire (sécurité backend)
  if (!filters.editionId) {
    throw new Error("editionId is required in filters");
  }

  // ✅ Toujours présent
  conditions.push(eq(matches.editionId, filters.editionId));

  // ✅ Optionnels (SAFE)
  if (filters.phaseId != null) {
    conditions.push(eq(matches.phaseId, filters.phaseId));
  }

  if (filters.groupId != null) {
    conditions.push(eq(matches.groupId, filters.groupId));
  }

  if (filters.bracketNodeId != null) {
    conditions.push(eq(matches.bracketNodeId, filters.bracketNodeId));
  }

  if (Array.isArray(filters.statuses) && filters.statuses.length > 0) {
    conditions.push(inArray(matches.status, filters.statuses));
  }

  // 🔥 important : jamais undefined
  return and(...conditions);
}

/**
 * Recalcule les statistiques et le classement pour un groupe spécifique
 */
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
        where: and(eq(phaseGroups.phaseId, id), eq(phaseGroups.isDeleted, false)),
      });

      for (const group of groups) {
        // On récupère les matchs rattachés à ce groupe
        const groupMatches = matchesList.filter(m => m.groupId === group.id);
        
        // Si le groupe a des participants prévus mais aucun match généré, c'est bloquant
        if (groupMatches.length === 0 && group.participantCount && group.participantCount > 0) {
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
 * Marque un groupe comme terminé avec qualification des participants
 * CORRIGÉ : Gère les groupes d'élimination (brackets) correctement
 */

export async function markGroupCompleteAction(groupId: string, options: {
  seedingMethod?: "RANDOM" | "SEQUENTIAL" | "SNAKE";
  isHomeAway?: boolean;
  matchFormat?: 'BEST_OF_1' | 'BEST_OF_3' | 'BEST_OF_5';
} = {}) {
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

    // 1. Vérification des matches non terminés
    const pending = await checkPendingEntitiesAction("GROUP", groupId);
    if (pending.pendingEntities.length > 0) {
      return {
        success: false,
        error: "Certaines entités ne sont pas encore terminées.",
        pendingEntities: pending.pendingEntities,
      };
    }

    const config = (group.config as any) || {};
    const advanceCount = config.advanceCount || 2;
    const groupType = group.groupType;
    const phaseType = group.phase?.phaseType;

    let qualifiedRegistrationIds: string[] = [];

    // 🔵 CAS 1: Phase de groupes classique
    if (
      phaseType === "GROUP_STAGE" ||
      phaseType === "ROUND_ROBIN" ||
      groupType === "ROUND_ROBIN"
    ) {
      const standings = await calculateGroupStandings(groupId);
      const tiebreakerRules = config.tiebreakerRules || ["POINTS", "GOAL_DIFF", "GOALS_FOR"];
      const sortedParticipants = rankParticipants(standings, tiebreakerRules);
      qualifiedRegistrationIds = sortedParticipants
        .slice(0, advanceCount)
        .map((p) => p.registrationId);
    }
    // 🔴 CAS 2: Phase élimination - Récupérer les winners des brackets
// 🔴 CAS 2: Phase élimination - Récupérer les winners des brackets
else if (phaseType === "ELIMINATION" || phaseType === "KNOCKOUT") {
  // Récupérer TOUS les brackets du groupe, y compris ceux qui sont terminés
  const allNodes = group.bracketNodes;
  
  // Récupérer les winners des brackets terminés
  const completedNodes = allNodes.filter(node => node.isCompleted === true && node.winnerRegistrationId);
  qualifiedRegistrationIds = completedNodes
    .map(node => node.winnerRegistrationId)
    .filter(Boolean) as string[];

  // ⚠️ Important: Si le groupe a des brackets sans winner (en attente), 
  // on ne peut pas encore marquer le groupe comme terminé
  const pendingNodes = allNodes.filter(node => !node.isCompleted);
  if (pendingNodes.length > 0) {
    return {
      success: false,
      error: `${pendingNodes.length} bracket(s) non terminé(s)`,
      pendingEntities: pendingNodes.map(n => ({ type: "NODE", id: n.id, label: n.nodeCode, reason: "Non terminé" }))
    };
  }

  // Si pas assez de winners, prendre les participants restants (BYEs ou placeholders)
  if (qualifiedRegistrationIds.length < advanceCount && advanceCount > completedNodes.length) {
    const allParticipants = group.participants.map(p => p.registrationId);
    const usedIds = new Set(qualifiedRegistrationIds);
    const available = allParticipants.filter(id => id && !usedIds.has(id));
    qualifiedRegistrationIds = [
      ...qualifiedRegistrationIds,
      ...available.slice(0, advanceCount - qualifiedRegistrationIds.length),
    ];
  }
}
    // 🟡 CAS 3: Fallback
    else {
      const standings = await calculateGroupStandings(groupId);
      const sortedParticipants = rankParticipants(standings, ["POINTS"]);
      qualifiedRegistrationIds = sortedParticipants
        .slice(0, advanceCount)
        .map(p => p.registrationId);
    }

    return await db.transaction(async (tx) => {
      // Marquer les qualifiés
      for (const participant of group.participants) {
        const isQualified = qualifiedRegistrationIds.includes(participant.registrationId);
        const position = qualifiedRegistrationIds.indexOf(participant.registrationId) + 1;

        await tx
          .update(phaseGroupParticipants)
          .set({
            qualified: isQualified,
            position: position > 0 ? position : null,
            updatedAt: new Date(),
          })
          .where(eq(phaseGroupParticipants.id, participant.id));
      }

      // Marquer le groupe comme terminé
      await tx
        .update(phaseGroups)
        .set({
          isCompleted: true,
          isLocked: true,
          updatedAt: new Date(),
        })
        .where(eq(phaseGroups.id, groupId));

      // 🧠 PROPAGATION vers le groupe suivant (pour élimination)
// 🧠 PROPAGATION vers le groupe suivant (pour élimination)
if ((phaseType === "ELIMINATION" || phaseType === "KNOCKOUT") && qualifiedRegistrationIds.length > 0) {
  // ✅ Appeler la fonction de propagation avec les qualifiés
  const propagationResult = await propagateEliminationRound(
    group.phaseId, 
    group.order,
    qualifiedRegistrationIds  // ✅ Passer les qualifiés pour éviter de les recalculer
  );
  
  if (propagationResult.propagated) {
    console.log(`[markGroupCompleteAction] Propagation réussie: ${propagationResult.propagatedCount} qualifiés vers le round ${(propagationResult?.nextGroupOrder || 0) + 1}`);
  } else if (propagationResult.isFinal) {
    console.log(`[markGroupCompleteAction] Phase élimination terminée - finale jouée`);
  } else {
    console.log(`[markGroupCompleteAction] En attente des autres groupes du round ${group.order}`);
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

    const nextPhase = await db.query.tournamentPhases.findFirst({
      where: and(
        eq(tournamentPhases.editionId, phase.editionId),
        gt(tournamentPhases.order, phase.order),
        eq(tournamentPhases.isDeleted, false),
      ),
      orderBy: asc(tournamentPhases.order),
    });

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

      if (nextPhase) {
        await tx
          .update(tournamentPhases)
          .set({ isActive: true, updatedAt: new Date() })
          .where(eq(tournamentPhases.id, nextPhase.id));
      }

      await updateEditionResultsFromPhase(tx, phaseId);

      revalidatePath(`/tournaments/dashboard`);
      return {
        success: true,
        isLastPhase: !nextPhase,
        nextPhaseId: nextPhase?.id,
        nextPhaseName: nextPhase?.name,
        qualifiedCount,
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
      // 🟢 Mode aller-retour: score agrégé
      const result = computeAggregatedWinner(completedMatches);
      winnerId = result.winnerId;
      aggregateScore1 = result.aggregateScore1;
      aggregateScore2 = result.aggregateScore2;
    } else {
      // 🔵 Mode BO1/BO3/BO5: nombre de wins
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

      // 📊 Upsert dans editionResults
      const editionId = node.phase?.editionId;
      if (editionId) {
        await tx
          .insert(editionResults)
          .values({
            editionId,
            registrationId: winnerId,
            position: 1,
            matchesPlayed: 0,
            matchesWon: 0,
            matchesLost: 0,
            matchesDrawn: 0,
            prizeCurrency: "GTC",
            statistics: {},
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [editionResults.editionId, editionResults.registrationId],
            set: { updatedAt: new Date() },
          });
      }

      // 🧠 PROPAGATION VERS LE GROUPE SUIVANT (élimination)
      if (node.groupId) {
        const groupParticipants =
          await tx.query.phaseGroupParticipants.findMany({
            where: eq(phaseGroupParticipants.groupId, node.groupId),
          });

        // ✅ Mettre à jour metadata.participants pour l'affichage UI
        const currentMetadata = (node.metadata as any) || {};
        await tx
          .update(bracketNodes)
          .set({
            metadata: {
              ...currentMetadata,
              participants: groupParticipants.map((p) => p.registrationId),
              winners: [winnerId],
            },
          })
          .where(eq(bracketNodes.id, nodeId));
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
 */
export async function generateMatchesAction(
  type: "PHASE" | "GROUP" | "NODE",
  id: string,
  options: any = {},
) {
  try {
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
 */
export async function resetEditionStructure(editionId: string) {
  try {
    if (!editionId) throw new Error("ID de l'édition requis");

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
              where: eq(phaseGroupParticipants.qualified, true),
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

    const results: any[] = [];

    // Uniquement via les groups
    for (const group of phase.groups) {
      for (const participant of group.participants) {
        results.push({
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
        });
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
        results.push({
          id: node.id,
          participantId: node.id,
          registrationId: node.winnerRegistrationId,
          name: node.nodeCode || node.id,
          image: null,
          email: null,
          phone: null,
          nodeId: node.id,
          position: 1,
        });
      }
    }

    return {
      success: true,
      qualified: results.sort(
        (a, b) => (a.position || 99) - (b.position || 99),
      ),
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
      const isElim = phase.phaseType === "ELIMINATION" || phase.phaseType === "KNOCKOUT";
      const isGroups = phase.phaseType === "GROUP_STAGE" || phase.phaseType === "ROUND_ROBIN";

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
          const qualifiedParticipants = await db.query.phaseGroupParticipants.findMany({
            where: and(
              inArray(phaseGroupParticipants.groupId, previousGroups.map(g => g.id)),
              eq(phaseGroupParticipants.qualified, true),
              eq(phaseGroupParticipants.isDeleted, false),
            ),
          });
          participantRegIds = qualifiedParticipants.map(p => p.registrationId);
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
            .map(r => r.registrationId);
        }
      }
    }

    // Fallback ultime : tous les inscrits
    if (participantRegIds.length === 0) {
      const registrations = await db.query.editionRegistrations.findMany({
        where: eq(editionRegistrations.editionId, phase.editionId),
      });
      participantRegIds = registrations.map(r => r.id);
    }

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
      if (phase.phaseType === "GROUP_STAGE" || phase.phaseType === "ROUND_ROBIN") {
        const groupsCount = (phase.config as any)?.groupsCount ?? 1;
        const perGroup = Math.ceil(participants.length / groupsCount);
        const createdGroups: any[] = [];

        for (let i = 0; i < groupsCount; i++) {
          const start = i * perGroup;
          const chunk = participants.slice(start, start + perGroup);
          if (chunk.length === 0) continue;

          const groupName = groupsCount === 1 ? "Classement" : `Groupe ${String.fromCharCode(65 + i)}`;

          const [group] = await tx
            .insert(phaseGroups)
            .values({
              phaseId: phase.id,
              name: groupName,
              order: i,
              participantCount: chunk.length,
              groupType: phase.phaseType === "ROUND_ROBIN" ? "ROUND_ROBIN" : "STANDARD",
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
              const totalMatches = (g.participants.length * (g.participants.length - 1)) / 2;
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
                    scheduledTime: getDefaultScheduledTime(m.round || 1, idx + 1),
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
      else if (phase.phaseType === "ELIMINATION" || phase.phaseType === "KNOCKOUT") {
        const participantCount = participants.length;
        const totalRounds = Math.ceil(Math.log2(participantCount));
        const nodePrefix = (phase.config as any)?.nodePrefix || "Match";
        const advanceCountGlobal = (phase.config as any)?.advanceCount || 1;

        let currentParticipants = [...participants];

        for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
          const matchesThisRound = Math.pow(2, totalRounds - roundIndex - 1);
          const groupName = getEliminationRoundName(matchesThisRound * 2);
          
          // Nombre de qualifiés pour ce round
          const advanceCountForRound = roundIndex === totalRounds - 1 ? 1 : matchesThisRound;

          // Créer le groupe pour ce round
          const [group] = await tx
            .insert(phaseGroups)
            .values({
              phaseId: phase.id,
              name: groupName,
              order: roundIndex,
              participantCount: roundIndex === 0 ? participantCount : matchesThisRound * 2,
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
              const p1 = roundIndex === 0 ? currentParticipants[matchIdx * 2] : null;
              const p2 = roundIndex === 0 ? currentParticipants[matchIdx * 2 + 1] : null;

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
                    participants: (p1 && p2) ? [p1, p2] : [],
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
                    matchCode: matchesToCreate > 1 ? `${node.nodeCode}-L${mIdx + 1}` : node.nodeCode,
                    status: "PENDING",
                    round: roundIndex + 1,
                    matchNumber: matchIdx + 1,
                    scheduledTime: getDefaultScheduledTime(roundIndex + 1, matchIdx + 1),
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
            const shuffled = options.seedMethod === "RANDOM" ? shuffle([...participants]) : [...participants];
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

// ============================================================================
// PROPAGATION ENTRE ROUNDS D'ÉLIMINATION
// ============================================================================

/**
 * Propage les qualifiés d'un round d'élimination vers le round suivant
 * CORRIGÉ : Vérifie que TOUS les groupes du round sont terminés avant de propager
 */
export async function propagateEliminationRound(
  phaseId: string, 
  currentGroupOrder: number, 
  qualifiedRegistrationIds?: string[] // ✅ Optionnel: passer directement les qualifiés
) {
  return await db.transaction(async (tx) => {
    // 1. Récupérer tous les groupes de ce round
    const groupsInCurrentRound = await tx.query.phaseGroups.findMany({
      where: and(
        eq(phaseGroups.phaseId, phaseId),
        eq(phaseGroups.order, currentGroupOrder),
        eq(phaseGroups.isDeleted, false)
      ),
    });

    // 2. Vérifier si TOUS les groupes de ce round sont terminés
    const allGroupsCompleted = groupsInCurrentRound.every(g => g.isCompleted === true);
    if (!allGroupsCompleted) {
      console.log(`[propagateEliminationRound] Round ${currentGroupOrder} not fully completed yet`);
      return { success: true, message: "Waiting for other groups", propagated: false };
    }

    // 3. Récupérer les qualifiés
    let allQualifiers: string[] = [];
    
    if (qualifiedRegistrationIds && qualifiedRegistrationIds.length > 0) {
      // Utiliser les qualifiés passés en paramètre
      allQualifiers = qualifiedRegistrationIds;
    } else {
      // Sinon, les récupérer depuis la base
      for (const group of groupsInCurrentRound) {
        const qualifiedParticipants = await tx.query.phaseGroupParticipants.findMany({
          where: and(
            eq(phaseGroupParticipants.groupId, group.id),
            eq(phaseGroupParticipants.qualified, true)
          ),
        });
        allQualifiers.push(...qualifiedParticipants.map(p => p.registrationId));
      }
    }

    if (allQualifiers.length === 0) {
      return { success: true, message: "No qualifiers found", propagated: false };
    }

    // 4. Trouver le groupe suivant
    const nextGroup = await tx.query.phaseGroups.findFirst({
      where: and(
        eq(phaseGroups.phaseId, phaseId),
        eq(phaseGroups.order, currentGroupOrder + 1),
        eq(phaseGroups.isDeleted, false)
      ),
    });

    if (!nextGroup) {
      // C'est la fin - la phase élimination est terminée
      return { success: true, message: "No next round - elimination phase complete", propagated: false, isFinal: true };
    }

    // 5. Nettoyer les participants existants du groupe suivant (optionnel, dépend du besoin)
    // Attention: cela supprime les participants existants - à utiliser avec précaution
    // await tx.delete(phaseGroupParticipants).where(eq(phaseGroupParticipants.groupId, nextGroup.id));

    // 6. Ajouter les qualifiés au groupe suivant
    for (const regId of allQualifiers) {
      const existing = await tx.query.phaseGroupParticipants.findFirst({
        where: and(
          eq(phaseGroupParticipants.groupId, nextGroup.id),
          eq(phaseGroupParticipants.registrationId, regId)
        ),
      });
      if (!existing) {
        await tx.insert(phaseGroupParticipants).values({
          groupId: nextGroup.id,
          registrationId: regId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // 7. Récupérer la configuration héritée
    const nextGroupConfig = (nextGroup.config as any) || {};
    const phase = await tx.query.tournamentPhases.findFirst({
      where: eq(tournamentPhases.id, phaseId),
    });
    
    const isHomeAway = nextGroupConfig.isHomeAway || false;
    const matchFormat = nextGroupConfig.matchFormat || "BEST_OF_1";
    const seedingMethod = nextGroupConfig.seedingMethod || "RANDOM";
    const nodePrefix = nextGroupConfig.nodePrefix || "Match";

    // 8. Tirage au sort
    let shuffledParticipants = [...allQualifiers];
    if (seedingMethod === "RANDOM") {
      shuffledParticipants = shuffle(shuffledParticipants);
    }

    // 9. Nettoyer les anciens brackets vides
    await tx.delete(bracketNodes).where(
      and(
        eq(bracketNodes.groupId, nextGroup.id),
        isNull(bracketNodes.winnerRegistrationId)
      )
    );

    // 10. Créer les brackets pour le round suivant
    const matchCount = Math.floor(shuffledParticipants.length / 2);
    const createdBrackets = [];

    for (let matchIdx = 0; matchIdx < matchCount; matchIdx++) {
      const p1 = shuffledParticipants[matchIdx * 2];
      const p2 = shuffledParticipants[matchIdx * 2 + 1];

      if (!p1 || !p2) continue;

      const [node] = await tx
        .insert(bracketNodes)
        .values({
          phaseId: phaseId,
          groupId: nextGroup.id,
          nodeCode: `${nodePrefix} ${matchIdx + 1}`,
          round: nextGroup.order + 1,
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

      createdBrackets.push(node);

      // Générer les matchs
      const matchesToCreate = isHomeAway ? 2 : 1;
      for (let mIdx = 0; mIdx < matchesToCreate; mIdx++) {
        await tx.insert(matches).values({
          editionId: phase?.editionId as string,
          phaseId: phaseId,
          groupId: nextGroup.id,
          bracketNodeId: node.id,
          participant1RegistrationId: mIdx === 0 ? p1 : p2,
          participant2RegistrationId: mIdx === 0 ? p2 : p1,
          matchCode: matchesToCreate > 1 ? `${node.nodeCode}-L${mIdx + 1}` : node.nodeCode,
          status: "PENDING",
          round: nextGroup.order + 1,
          matchNumber: matchIdx + 1,
          metadata: {
            format: isHomeAway ? "HOME_AWAY" : matchFormat,
            leg: mIdx + 1,
            isHomeAway: isHomeAway,
          },
          scheduledTime: getDefaultScheduledTime(nextGroup.order + 1, matchIdx + 1),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // 11. Mettre à jour les stats du groupe suivant
    await tx.update(phaseGroups)
      .set({
        participantCount: shuffledParticipants.length,
        matchCount: matchCount * (isHomeAway ? 2 : 1),
        updatedAt: new Date()
      })
      .where(eq(phaseGroups.id, nextGroup.id));

    return { 
      success: true, 
      propagatedCount: allQualifiers.length, 
      nextGroupId: nextGroup.id,
      nextGroupOrder: nextGroup.order
    };
  });
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
  const groupParticipants = await tx.query.phaseGroupParticipants.findMany({
    where: eq(phaseGroupParticipants.groupId, groupId),
  });

  const group = await tx.query.phaseGroups.findFirst({
    where: eq(phaseGroups.id, groupId),
    with: { phase: true },
  });

  for (const p of groupParticipants) {
    await tx
      .insert(editionResults)
      .values({
        editionId: group.phase.editionId,
        registrationId: p.registrationId,
        matchesPlayed: p.matchesPlayed,
        matchesWon: p.matchesWon,
        matchesLost: p.matchesLost,
        matchesDrawn: p.matchesDrawn,
        totalScore: p.points,
        position: p.position || 0,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [editionResults.editionId, editionResults.registrationId],
        set: {
          matchesPlayed: p.matchesPlayed,
          matchesWon: p.matchesWon,
          matchesLost: p.matchesLost,
          matchesDrawn: p.matchesDrawn,
          totalScore: p.points,
          updatedAt: new Date(),
        },
      });
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
    with: { matches: true },
  });

  if (!node) return;

  const editionId = node.phaseId
    ? (
        await tx.query.tournamentPhases.findFirst({
          where: eq(tournamentPhases.id, node.phaseId),
        })
      )?.editionId
    : null;
  if (!editionId) return;

  // Pour chaque participant du nœud, mettre à jour ses stats de base
  const participants = (node.metadata as any)?.participants || [];

  for (const regId of participants) {
    const regMatches = node.matches.filter(
      (m: any) =>
        m.player1RegistrationId === regId || m.player2RegistrationId === regId,
    );

    let won = 0,
      lost = 0,
      drawn = 0;
    regMatches.forEach((m: any) => {
      if (m.status === "COMPLETED") {
        if (m.winnerRegistrationId === regId) won++;
        else if (m.winnerRegistrationId) lost++;
        else drawn++;
      }
    });

    await tx
      .insert(editionResults)
      .values({
        editionId,
        registrationId: regId,
        matchesPlayed: regMatches.length,
        matchesWon: won,
        matchesLost: lost,
        matchesDrawn: drawn,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [editionResults.editionId, editionResults.registrationId],
        set: {
          matchesPlayed: sql`${editionResults.matchesPlayed} + ${regMatches.length}`,
          matchesWon: sql`${editionResults.matchesWon} + ${won}`,
          matchesLost: sql`${editionResults.matchesLost} + ${lost}`,
          matchesDrawn: sql`${editionResults.matchesDrawn} + ${drawn}`,
          updatedAt: new Date(),
        },
      });
  }
}

/**
 * Retourne le contexte d'une phase pour le dialogue de clôture
 * Utilisé par MarkCompleteDialog
 */
export async function getPhaseContextAction(phaseId: string): Promise<{
  isFinalPhase: boolean;
  nextPhaseId: string | null;
  nextPhaseName: string | null;
  phaseType: string;
  groupsCount: number;
  qualifiedCount: number;
  hasPendingEntities: boolean;
  editionId: string;
}> {
  const phase = await db.query.tournamentPhases.findFirst({
    where: eq(tournamentPhases.id, phaseId),
    with: {
      groups: {
        where: eq(phaseGroups.isDeleted, false),
      },
    },
  });

  if (!phase) {
    throw new Error("Phase introuvable");
  }

  // Trouver la phase suivante
  const nextPhase = await db.query.tournamentPhases.findFirst({
    where: and(
      eq(tournamentPhases.editionId, phase.editionId),
      gt(tournamentPhases.order, phase.order),
      eq(tournamentPhases.isDeleted, false),
    ),
    orderBy: asc(tournamentPhases.order),
  });

  // Compter les qualifiés
  let qualifiedCount = 0;
  for (const group of phase.groups) {
    const qualified = await db.query.phaseGroupParticipants.findMany({
      where: and(
        eq(phaseGroupParticipants.groupId, group.id),
        eq(phaseGroupParticipants.qualified, true),
      ),
    });
    qualifiedCount += qualified.length;
  }

  // Vérifier les entités en attente
  const pending = await checkPendingEntitiesAction("PHASE", phaseId);

  return {
    isFinalPhase: !nextPhase,
    nextPhaseId: nextPhase?.id || null,
    nextPhaseName: nextPhase?.name || null,
    phaseType: phase.phaseType || "UNKNOWN",
    groupsCount: phase.groups.length,
    qualifiedCount,
    hasPendingEntities: pending.pendingEntities.length > 0,
    editionId: phase.editionId,
  };
}

/**
 * Setup d'une phase élimination avec groups par round
 * Utilise phaseGroupParticipants comme source unique
 */
export async function setupEliminationGroups(
  tx: any,
  editionId: string,
  phase: any,
  participantRegIds: string[],
  options: {
    generateNodes?: boolean;
    generateMatches?: boolean;
    isHomeAway?: boolean;
    matchFormat?: "BEST_OF_1" | "BEST_OF_3" | "BEST_OF_5";
    seedMethod?: "RANDOM" | "ORDERED";
    nodePrefix?: string;
  } = {},
) {
  const participantCount = participantRegIds.length;
  const totalRounds = Math.ceil(Math.log2(participantCount));
  const createdGroups = [];
  let currentParticipants = [...participantRegIds];

  // Mélange si demandé
  if (options.seedMethod === "RANDOM") {
    currentParticipants = shuffle(currentParticipants);
  }

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
    const matchesThisRound = Math.pow(2, totalRounds - roundIndex - 1);
    const groupName = getEliminationRoundName(matchesThisRound * 2);

    // ✅ advanceCount = nombre de qualifiés pour ce round (vers le round suivant)
    // Pour le dernier round (finale), advanceCount = 1 (un seul vainqueur)
    // Pour les rounds intermédiaires, advanceCount = matchesThisRound (un gagnant par match)
    const advanceCountForRound =
      roundIndex === totalRounds - 1 ? 1 : matchesThisRound;

    // Créer le group pour ce round
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
          advanceCount: advanceCountForRound, // ✅ Stocker le nombre de qualifiés
          isHomeAway: options.isHomeAway || false,
          matchFormat: options.matchFormat || "BEST_OF_1",
          nodePrefix: options.nodePrefix || "Match",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    createdGroups.push(group);

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

    // Créer les bracketNodes (un par match) si demandé
    if (options.generateNodes !== false) {
      for (let matchIdx = 0; matchIdx < matchesThisRound; matchIdx++) {
        const p1 = roundIndex === 0 ? currentParticipants[matchIdx * 2] : null;
        const p2 =
          roundIndex === 0 ? currentParticipants[matchIdx * 2 + 1] : null;

        const [node] = await tx
          .insert(bracketNodes)
          .values({
            phaseId: phase.id,
            groupId: group.id,
            nodeCode: `${roundIndex + 1}-${matchIdx + 1}`,
            round: roundIndex + 1,
            matchNumber: matchIdx + 1,
            bracketType: "UPPER",
            order: matchIdx,
            metadata: {
              requiresMatch: roundIndex === 0,
              matchFormat: options.matchFormat || "BEST_OF_1",
              isHomeAway: options.isHomeAway || false,
              format: options.isHomeAway
                ? "HOME_AWAY"
                : options.matchFormat || "BEST_OF_1",
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        // Générer les matchs pour le premier round si demandé
        if (roundIndex === 0 && p1 && p2 && options.generateMatches !== false) {
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
              round: roundIndex + 1,
              matchNumber: matchIdx + 1,
              metadata: {
                format: options.isHomeAway
                  ? "HOME_AWAY"
                  : options.matchFormat || "BEST_OF_1",
                leg: mIdx + 1,
              },
              scheduledTime: getDefaultScheduledTime(
                roundIndex + 1,
                matchIdx + 1,
              ),
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
