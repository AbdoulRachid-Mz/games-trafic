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
} from "@/database/schema";
import {
  eq,
  and,
  desc,
  asc,
  sql,
  count,
  inArray,
} from "drizzle-orm";
import {
  type TournamentPhaseFilters,
  type PhaseGroupFilters,
  type PhaseGroupParticipantFilters,
  type BracketNodeFilters,
  type MatchFilters,
  type ListQuery,
  type PaginationResponse,
} from "@/types/api";
import { db } from "@/lib/db";
import { checkPendingEntitiesAction } from "./progression";
import {
  buildTournamentPhaseWhereConditions,
  buildPhaseGroupWhereConditions,
  buildPhaseGroupParticipantWhereConditions,
  buildBracketNodeWhereConditions,
  buildMatchWhereConditions,
} from "./helpers";


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

export async function getPhaseContextAction(phaseId: string): Promise<{
  isFinalPhase: boolean;
  nextPhaseId: string | null;
  nextPhaseName: string | null;
  phaseType: string;
  groupsCount: number;
  qualifiedCount: number;
  hasPendingEntities: boolean;
  editionId: string;
  totalPhasesInEdition: number;
  currentPhaseOrder: number;
}> {
  const phase = await db.query.tournamentPhases.findFirst({
    where: eq(tournamentPhases.id, phaseId),
    with: {
      groups: {
        where: eq(phaseGroups.isDeleted, false),
      },
      edition: true,
    },
  });

  if (!phase) {
    throw new Error("Phase introuvable");
  }

  // 🔥 Trouver TOUTES les phases de l'édition (pas seulement la suivante)
  const allPhases = await db.query.tournamentPhases.findMany({
    where: and(
      eq(tournamentPhases.editionId, phase.editionId),
      eq(tournamentPhases.isDeleted, false),
    ),
    orderBy: asc(tournamentPhases.order),
  });

  // 🔥 Trouver la phase suivante (prochain order)
  const nextPhase = allPhases.find((p) => (p.order || 0) > (phase.order || 0));

  // 🔥 Déterminer si c'est la dernière phase PRÉVUE par l'édition
  const editionConfig = (phase.edition?.editionConfig as any) || {};
  const competitionType = editionConfig.competitionType || "LDC";

  // Nombre de phases attendues selon le type de compétition
  let expectedPhasesCount = 1;
  if (competitionType === "LDC") {
    expectedPhasesCount = 2; // Groupes + Élimination
  } else if (competitionType === "CUP") {
    expectedPhasesCount = 1; // Élimination directe
  } else if (competitionType === "CHAMPIONSHIP") {
    expectedPhasesCount = 1; // Championnat
  } else if (competitionType === "SWISS") {
    expectedPhasesCount = 1;
  }

  // Une phase est finale si:
  // 1. Il n'y a pas de phase suivante DANS LA BDD
  // 2. OU si le nombre de phases existantes atteint le nombre attendu
  //    et que c'est la dernière dans l'ordre
  const isFinalPhase =
    !nextPhase ||
    (allPhases.length >= expectedPhasesCount &&
      (phase.order || 0) === Math.max(...allPhases.map((p) => p.order || 0)));

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
    isFinalPhase,
    nextPhaseId: nextPhase?.id || null,
    nextPhaseName: nextPhase?.name || null,
    phaseType: phase.phaseType || "UNKNOWN",
    groupsCount: phase.groups.length,
    qualifiedCount,
    hasPendingEntities: pending.pendingEntities.length > 0,
    editionId: phase.editionId,
    totalPhasesInEdition: allPhases.length,
    currentPhaseOrder: phase.order || 0,
  };
}

/**
 * Setup d'une phase élimination avec groups par round
 * Utilise phaseGroupParticipants comme source unique
 */

/**
 * Set up an Elimination (Bracket) phase with groups per level
 * CORRIGE: L'ordre des groupes et le calcul du parentNodeId
 */
