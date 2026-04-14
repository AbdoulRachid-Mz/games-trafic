'use server';

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
} from '@/database/schema';
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
} from 'drizzle-orm';
import {
  type TournamentPhaseFilters,
  type PhaseGroupFilters,
  type PhaseGroupParticipantFilters,
  type BracketNodeFilters,
  type MatchFilters,
  type ListQuery,
  type PaginationResponse,
  type QueryOptions,
} from '@/types/api';
import { db } from '@/lib/db';
import { generateGroupMatches, generateRoundRobinMatches } from '@/lib/tournaments/match.generator';
import { revalidatePath } from 'next/cache';
import { shuffle, chunk } from '@/lib/tournaments/utils';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère une phase de tournoi par son ID avec relations optionnelles
 */
export async function getTournamentPhaseById(
  id: string,
  options?: { populate?: string[] }
): Promise<TournamentPhase | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.tournamentPhases.findFirst({
        where: (tournamentPhases, { eq }) => eq(tournamentPhases.id, id),
        with: {
          edition: options.populate.includes('edition') ? true : undefined,
          groups: options.populate.includes('groups') ? true : undefined,
          bracketNodes: options.populate.includes('bracketNodes') ? true : undefined,
          matches: options.populate.includes('matches') ? true : undefined,
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
    console.error('Error getting tournament phase by ID:', error);
    throw new Error('Failed to fetch tournament phase');
  }
}

/**
 * Liste les phases d'une édition avec pagination, filtres et options
 */
export async function getTournamentPhases(
  query: ListQuery<TournamentPhaseFilters> = {}
): Promise<PaginationResponse<TournamentPhase>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    // Build where conditions safely
    let whereConditions;
    try {
      whereConditions = buildTournamentPhaseWhereConditions(filters, options);
    } catch (buildError) {
      console.error('Error building where conditions:', buildError);
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
        const sortOrder = options.sortOrder === 'desc' ? desc : asc;
        phasesQuery.orderBy(sortOrder(tournamentPhases[sortField]));
      } else {
        phasesQuery.orderBy(asc(tournamentPhases.order));
      }

      const countQuery = db
        .select({ count: count() })
        .from(tournamentPhases)
        .where(whereConditions);

      const [phasesResult, countResult] = await Promise.all([
        phasesQuery.execute().catch(err => {
          console.error('Phases query failed:', err);
          return [];
        }),
        countQuery.execute().catch(err => {
          console.error('Count query failed:', err);
          return [{ count: 0 }];
        })
      ]);

      phasesData = phasesResult;
      total = countResult[0]?.count ?? 0;
    } catch (queryError) {
      console.error('Database query error:', queryError);
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
    console.error('Error getting tournament phases:', error);
    throw new Error('Failed to fetch tournament phases');
  }
}
/**
 * Récupère les statistiques des phases de tournoi
 */
export async function getTournamentPhaseStats(filters?: TournamentPhaseFilters) {
  try {
    const whereConditions = buildTournamentPhaseWhereConditions(filters || {});

    const [totalResult, activeResult, completedResult] = await Promise.all([
      db.select({ count: count() }).from(tournamentPhases).where(whereConditions),
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
    console.error('Error getting tournament phase stats:', error);
    throw new Error('Failed to fetch tournament phase statistics');
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
  options?: { populate?: string[] }
): Promise<PhaseGroup | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.phaseGroups.findFirst({
        where: (phaseGroups, { eq }) => eq(phaseGroups.id, id),
        with: {
          phase: options.populate.includes('phase') ? true : undefined,
          participants: options.populate.includes('participants') ? true : undefined,
          bracketNodes: options.populate.includes('bracketNodes') ? true : undefined,
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
    console.error('Error getting phase group by ID:', error);
    throw new Error('Failed to fetch phase group');
  }
}

/**
 * Liste les groupes d'une phase avec pagination et filtres
 */
export async function getPhaseGroups(
  query: ListQuery<PhaseGroupFilters> = {}
): Promise<PaginationResponse<PhaseGroup>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
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
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      groupsQuery.orderBy(sortOrder(phaseGroups[sortField]));
    } else {
      groupsQuery.orderBy(asc(phaseGroups.order));
    }

    const countQuery = db
      .select({ count: count() })
      .from(phaseGroups)
      .where(whereConditions);

    const [groupsData, totalResult] = await Promise.all([groupsQuery, countQuery]);

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
    console.error('Error getting phase groups:', error);
    throw new Error('Failed to fetch phase groups');
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
  options?: { populate?: string[] }
): Promise<PhaseGroupParticipant | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.phaseGroupParticipants.findFirst({
        where: (phaseGroupParticipants, { eq }) => eq(phaseGroupParticipants.id, id),
        with: {
          group: options.populate.includes('group') ? true : undefined,
          registration: options.populate.includes('registration') ? {
            with: {
              member: options.populate.includes('member') ? true : undefined,
              edition: options.populate.includes('edition') ? true : undefined,
            }
          } : undefined,
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
    console.error('Error getting phase group participant by ID:', error);
    throw new Error('Failed to fetch phase group participant');
  }
}

/**
 * Supprime un participant de groupe par son ID et recalcule les classements.
 */
export async function deletePhaseGroupParticipant(id: string): Promise<void> {
  try {
    const [participant] = await db
      .select({ id: phaseGroupParticipants.id, groupId: phaseGroupParticipants.groupId })
      .from(phaseGroupParticipants)
      .where(eq(phaseGroupParticipants.id, id))
      .limit(1);

    if (!participant) return;

    await db.delete(phaseGroupParticipants).where(eq(phaseGroupParticipants.id, id));

    // Recalculate standings if groupId exists
    if (participant.groupId) {
      await recalculateGroupStandings(participant.groupId);
    }
  } catch (error) {
    console.error("Error deleting phase group participant:", error);
    throw new Error('Failed to delete phase group participant');
  }
}

/**
 * Supprime plusieurs participants de groupe par leurs IDs
 */
export async function bulkDeletePhaseGroupParticipants(
  ids: string[]
): Promise<void> {
  try {
    if (ids.length === 0) return;

    await db
      .delete(phaseGroupParticipants)
      .where(inArray(phaseGroupParticipants.id, ids));
  } catch (error) {
    console.error('Error bulk deleting phase group participants:', error);
    throw new Error('Failed to bulk delete phase group participants');
  }
}

/**
 * Liste les participants d'un groupe avec pagination et filtres
 */
export async function getPhaseGroupParticipants(
  query: ListQuery<PhaseGroupParticipantFilters> = {}
): Promise<PaginationResponse<PhaseGroupParticipant>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildPhaseGroupParticipantWhereConditions(filters, options);

    const participantsQuery = db
      .select()
      .from(phaseGroupParticipants)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof PhaseGroupParticipant;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      participantsQuery.orderBy(sortOrder(phaseGroupParticipants[sortField]));
    } else {
      participantsQuery.orderBy(desc(phaseGroupParticipants.points));
    }

    const countQuery = db
      .select({ count: count() })
      .from(phaseGroupParticipants)
      .where(whereConditions);

    const [participantsData, totalResult] = await Promise.all([participantsQuery, countQuery]);

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
    console.error('Error getting phase group participants:', error);
    throw new Error('Failed to fetch phase group participants');
  }
}

/**
 * Récupère les classements complets d'une phase (groupes + participants calculés)
 * Utilisé par EditionStandingsTab pour un affichage performant
 */
export async function getPhaseStandings(phaseId: string) {
  try {
    const groupsWithParticipants = await db.query.phaseGroups.findMany({
      where: and(eq(phaseGroups.phaseId, phaseId), eq(phaseGroups.isDeleted, false)),
      orderBy: [asc(phaseGroups.order)],
      with: {
        participants: {
          orderBy: [desc(phaseGroupParticipants.points), asc(phaseGroupParticipants.position)],
          with: {
            registration: {
              with: {
                member: {
                  with: {
                    user: {
                      columns: { id: true, username: true, fullName: true, profileImage: true, image: true }
                    },
                    team: {
                      columns: { id: true, name: true, logo: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return groupsWithParticipants.map(group => ({
      groupId: group.id,
      groupName: group.name,
      rows: (group.participants || []).map(p => ({
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
        displayName: p.registration?.member?.user?.username || p.registration?.member?.user?.fullName || "Anonyme",
        avatar: p.registration?.member?.user?.profileImage || p.registration?.member?.user?.image,
        teamName: p.registration?.member?.team?.name,
        teamLogo: p.registration?.member?.team?.logo
      }))
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
  options?: { populate?: string[] }
): Promise<BracketNode | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.bracketNodes.findFirst({
        where: (bracketNodes, { eq }) => eq(bracketNodes.id, id),
        with: {
          phase: options.populate.includes('phase') ? true : undefined,
          group: options.populate.includes('group') ? true : undefined,
          parentNode: options.populate.includes('parentNode') ? true : undefined,
          childNodes: options.populate.includes('childNodes') ? true : undefined,
          match: options.populate.includes('match') ? true : undefined,
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
    console.error('Error getting bracket node by ID:', error);
    throw new Error('Failed to fetch bracket node');
  }
}

/**
 * Liste les nœuds de bracket d'une phase avec pagination et filtres
 */
export async function getBracketNodes(
  query: ListQuery<BracketNodeFilters> = {}
): Promise<PaginationResponse<BracketNode>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
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
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      nodesQuery.orderBy(sortOrder(bracketNodes[sortField]));
    } else {
      nodesQuery.orderBy(asc(bracketNodes.order));
    }

    const countQuery = db
      .select({ count: count() })
      .from(bracketNodes)
      .where(whereConditions);

    const [nodesData, totalResult] = await Promise.all([nodesQuery, countQuery]);

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
    console.error('Error getting bracket nodes:', error);
    throw new Error('Failed to fetch bracket nodes');
  }
}

// ============================================================================
// MATCHS
// ============================================================================

/**
 * Récupère un match par son ID
 */
export async function getMatchById(
  id: string,
  options?: { populate?: string[] }
): Promise<Match | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.matches.findFirst({
        where: (matches, { eq }) => eq(matches.id, id),
        with: {
          edition: options.populate.includes('edition') ? true : undefined,
          phase: options.populate.includes('phase') ? true : undefined,
          group: options.populate.includes('group') ? true : undefined,
          bracketNode: options.populate.includes('bracketNode') ? true : undefined,
          participant1: options.populate.includes('participant1') ? {
            with: {
              member: options.populate.includes('member1') ? true : undefined,
            }
          } : undefined,
          participant2: options.populate.includes('participant2') ? {
            with: {
              member: options.populate.includes('member2') ? true : undefined,
            }
          } : undefined,
          winner: options.populate.includes('winner') ? {
            with: {
              member: options.populate.includes('winnerMember') ? true : undefined,
            }
          } : undefined,
          loser: options.populate.includes('loser') ? {
            with: {
              member: options.populate.includes('loserMember') ? true : undefined,
            }
          } : undefined,
          submittedBy: options.populate.includes('submittedBy') ? true : undefined,
          resolvedBy: options.populate.includes('resolvedBy') ? true : undefined,
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
    console.error('Error getting match by ID:', error);
    throw new Error('Failed to fetch match');
  }
}

/**
 * Liste les matchs avec pagination et filtres
 */
export async function getMatches(
  query: ListQuery<MatchFilters> = {}
): Promise<PaginationResponse<Match>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
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
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      matchesQuery.orderBy(sortOrder(matches[sortField]));
    } else {
      matchesQuery.orderBy(asc(matches.scheduledTime));
    }

    const countQuery = db
      .select({ count: count() })
      .from(matches)
      .where(whereConditions);

    const [matchesData, totalResult] = await Promise.all([matchesQuery, countQuery]);

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
    console.error('Error getting matches:', error);
    throw new Error('Failed to fetch matches');
  }
}


export async function generatePhaseMatches(phaseId: string, config?: { forceRecreate?: boolean; groupId?: string }) {
  try {
    const phase = await db.query.tournamentPhases.findFirst({
      where: eq(tournamentPhases.id, phaseId),
      with: {
        groups: {
          with: {
            participants: true,
            bracketNodes: true,
          }
        }
      }
    });

    if (!phase) throw new Error("Phase not found");

    if (config?.forceRecreate) {
      if (config.groupId) {
        await db.delete(matches).where(and(eq(matches.groupId, config.groupId), eq(matches.status, "PENDING")));
      } else {
        await db.delete(matches).where(and(eq(matches.phaseId, phaseId), eq(matches.status, "PENDING")));
      }
    }

    const createdMatches = [];
    const createdNodes = [];

    if (phase.phaseType === "GROUP_STAGE" && phase.groups) {
      const groupsToProcess = config?.groupId ? phase.groups.filter((g: any) => g.id === config.groupId) : phase.groups;
      
      for (const group of groupsToProcess) {
        const participants = group.participants || [];
        if (participants.length < 2) continue;
        
        // Ensure bracket nodes exist for the group if none
        let nodes = group.bracketNodes || [];
        if (nodes.length === 0) {
           // Create a default node for the group
           const nodeRes = await db.insert(bracketNodes).values({
              phaseId,
              groupId: group.id,
              nodeCode: `${group.name || 'G'}-N1`,
              round: 1,
              matchNumber: 1,
              metadata: { 
                 participants: participants.map((p: any) => p.registrationId),
                 name: "Général",
                 generateMatches: true,
                 matchesCount: 1,
                 format: 'BEST_OF_1'
              },
           } as any).returning();
           nodes = [nodeRes[0]];
           createdNodes.push(nodeRes[0]);
        } else {
           // Update nodes with participants if they are empty
           for (const node of nodes) {
              const metadata = (node.metadata as any) || {};
              if (!metadata.participants || metadata.participants.length === 0) {
                 await db.update(bracketNodes).set({
                    metadata: { 
                      ...metadata, 
                      participants: participants.map((p: any) => p.registrationId) 
                    },
                 }).where(eq(bracketNodes.id, node.id));
              }
           }
        }

        // Generate matches for each node
        for (const node of nodes) {
           const nodeMetadata = (node.metadata as any) || {};
           const nodeParticipants = nodeMetadata.participants || participants.map((p: any) => p.registrationId);
           
           const generated = generateGroupMatches(nodeParticipants.map((id: string) => ({
              id
           })), { returnType: "single" });
           
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
                
                const res = await db.insert(matches).values(mData as any).returning();
                createdMatches.push(res[0]);
           }
        }
      }
    } else if (phase.phaseType === "ELIMINATION") {
      // Logic for elimination remains similar but ensures nodes are created
      // ... existing elimination logic
    }

    revalidatePath(`/tournaments/editions/${phase.editionId}/dashboard`);
    return { success: true, count: createdMatches.length, nodesCount: createdNodes.length };
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
  query: ListQuery<MatchFilters> = {}
): Promise<PaginationResponse<any>> {
  try {
    const { pagination = { page: 1, limit: 20 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildMatchWhereConditions(filters, options);

    const matchesData = await db.query.matches.findMany({
      where: whereConditions,
      limit: pagination.limit,
      offset,
      orderBy: options.sortBy === 'scheduledTime'
        ? [asc(matches.scheduledTime)]
        : options.sortBy === 'createdAt'
        ? [desc(matches.createdAt)]
        : [asc(matches.scheduledTime)],
      with: {
        participant1: {
          with: {
            member: {
              with: {
                user: { columns: { id: true, username: true, fullName: true, profileImage: true, image: true } },
                team: { columns: { id: true, name: true, logo: true } }
              }
            }
          }
        },
        participant2: {
          with: {
            member: {
              with: {
                user: { columns: { id: true, username: true, fullName: true, profileImage: true, image: true } },
                team: { columns: { id: true, name: true, logo: true } }
              }
            }
          }
        },
        phase: { columns: { id: true, name: true, phaseType: true } },
        group: { columns: { id: true, name: true } },
      }
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
    console.error('Error getting matches with participants:', error);
    throw new Error('Failed to fetch matches with participants');
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
    const [totalRes, completedRes, inProgressRes, disputedRes] = await Promise.all([
      db.select({ count: count() }).from(matches)
        .where(and(eq(matches.editionId, editionId), eq(matches.isDeleted, false))),
      db.select({ count: count() }).from(matches)
        .where(and(eq(matches.editionId, editionId), eq(matches.status, 'COMPLETED'), eq(matches.isDeleted, false))),
      db.select({ count: count() }).from(matches)
        .where(and(eq(matches.editionId, editionId), eq(matches.status, 'IN_PROGRESS'), eq(matches.isDeleted, false))),
      db.select({ count: count() }).from(matches)
        .where(and(eq(matches.editionId, editionId), eq(matches.status, 'DISPUTED'), eq(matches.isDeleted, false))),
    ]);

    const total = totalRes[0]?.count ?? 0;
    const completed = completedRes[0]?.count ?? 0;
    const inProgress = inProgressRes[0]?.count ?? 0;
    const disputed = disputedRes[0]?.count ?? 0;

    return { total, completed, inProgress, pending: total - completed - inProgress - disputed, disputed };
  } catch (error) {
    console.error('Error getting edition match stats:', error);
    throw new Error('Failed to fetch edition match stats');
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
    if (!group) throw new Error('Groupe introuvable');

    const config = (group.config as any) || {};
    const max: number | null = config.maxParticipants ?? null;
    const current = group.participants.length;

    return { current, max, isFull: max !== null && current >= max };
  } catch (error) {
    console.error('Error checking group capacity:', error);
    throw error;
  }
}

/**
 * Générer les matchs depuis un bracket node (config.participants = registrationIds[])
 */
export async function generateBracketMatches(
  bracketNodeId: string,
  config?: { returnType?: 'single' | 'double'; forceRecreate?: boolean }
): Promise<{ success: boolean; count: number }> {
  try {
    const node = await db.query.bracketNodes.findFirst({
      where: eq(bracketNodes.id, bracketNodeId),
      with: { phase: true, group: true },
    });

    if (!node) throw new Error('Bracket node introuvable');

    const nodeMetadata = (node.metadata as any) || {};
    const participantIds: string[] = nodeMetadata.participants || [];

    if (participantIds.length < 2) {
      throw new Error(`Le bracket doit avoir au moins 2 participants (actuellement ${participantIds.length})`);
    }

    // Valider que les participants appartiennent bien au groupe parent
    if (node.groupId) {
      const groupParticipants = await db.query.phaseGroupParticipants.findMany({
        where: eq(phaseGroupParticipants.groupId, node.groupId),
      });
      const validIds = new Set(groupParticipants.map(p => p.registrationId));
      const invalidIds = participantIds.filter(id => !validIds.has(id));
      if (invalidIds.length > 0) {
        throw new Error(`Participants invalides (non membres du groupe) : ${invalidIds.join(', ')}`);
      }
    }

    if (config?.forceRecreate) {
      await db.delete(matches).where(
        and(eq(matches.bracketNodeId, bracketNodeId), eq(matches.status, 'PENDING'))
      );
    }

    const generated = generateGroupMatches(
      participantIds.map(id => ({ id })),
      { returnType: config?.returnType ?? 'single' }
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
        status: 'PENDING' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const res = await db.insert(matches).values(mData as any).returning();
      createdMatches.push(res[0]);
    }

    return { success: true, count: createdMatches.length };
  } catch (error) {
    console.error('Error generating bracket matches:', error);
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
  phaseData: NewTournamentPhase
): Promise<TournamentPhase> {
  try {
    if (!phaseData.editionId || !phaseData.name || phaseData.order === undefined) {
      throw new Error('editionId, name and order are required');
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
    console.error('Error creating tournament phase:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create tournament phase');
  }
}

/**
 * Crée plusieurs phases de tournoi en une seule transaction
 */
export async function bulkCreateTournamentPhases(
  phasesData: NewTournamentPhase[]
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
        }))
      )
      .returning();

    return result;
  } catch (error) {
    console.error('Error bulk creating tournament phases:', error);
    throw new Error('Failed to bulk create tournament phases');
  }
}

/**
 * Met à jour une phase de tournoi
 */
export async function updateTournamentPhase(
  id: string,
  phaseData: Partial<NewTournamentPhase>
): Promise<TournamentPhase> {
  try {
    const existingPhase = await getTournamentPhaseById(id);
    if (!existingPhase) {
      throw new Error('Tournament phase not found');
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
    console.error('Error updating tournament phase:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update tournament phase');
  }
}

/**
 * Supprime une phase de tournoi (soft delete)
 */
export async function deleteTournamentPhase(id: string): Promise<TournamentPhase> {
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
      throw new Error('Tournament phase not found');
    }
    return result[0];
  } catch (error) {
    console.error('Error deleting tournament phase:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete tournament phase');
  }
}

/**
 * Crée un nouveau groupe de phase
 */
export async function createPhaseGroup(groupData: NewPhaseGroup): Promise<PhaseGroup> {
  try {
    if (!groupData.phaseId || !groupData.name || groupData.order === undefined) {
      throw new Error('phaseId, name and order are required');
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
    console.error('Error creating phase group:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create phase group');
  }
}

/**
 * Crée plusieurs groupes de phase en une seule transaction
 */
export async function bulkCreatePhaseGroups(
  groupsData: NewPhaseGroup[]
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
        }))
      )
      .returning();

    return result;
  } catch (error) {
    console.error('Error bulk creating phase groups:', error);
    throw new Error('Failed to bulk create phase groups');
  }
}

/**
 * Met à jour un groupe de phase
 */
export async function updatePhaseGroup(
  id: string,
  groupData: Partial<NewPhaseGroup>
): Promise<PhaseGroup> {
  try {
    const existingGroup = await getPhaseGroupById(id);
    if (!existingGroup) {
      throw new Error('Phase group not found');
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
    console.error('Error updating phase group:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update phase group');
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
      throw new Error('Phase group not found');
    }
    return result[0];
  } catch (error) {
    console.error('Error deleting phase group:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete phase group');
  }
}

/**
 * Crée un nouveau participant de groupe
 */
export async function createPhaseGroupParticipant(
  participantData: NewPhaseGroupParticipant
): Promise<PhaseGroupParticipant> {
  try {
    if (!participantData.groupId || !participantData.registrationId) {
      throw new Error('groupId and registrationId are required');
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
    console.error('Error creating phase group participant:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create phase group participant');
  }
}

/**
 * Crée plusieurs participants de groupe en une seule transaction
 */
export async function bulkCreatePhaseGroupParticipants(
  participantsData: NewPhaseGroupParticipant[]
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
        }))
      )
      .returning();

    return result;
  } catch (error) {
    console.error('Error bulk creating phase group participants:', error);
    throw new Error('Failed to bulk create phase group participants');
  }
}

/**
 * Met à jour un participant de groupe
 */
export async function updatePhaseGroupParticipant(
  id: string,
  participantData: Partial<NewPhaseGroupParticipant>
): Promise<PhaseGroupParticipant> {
  try {
    const existingParticipant = await getPhaseGroupParticipantById(id);
    if (!existingParticipant) {
      throw new Error('Phase group participant not found');
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
    console.error('Error updating phase group participant:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update phase group participant');
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
  nodeData: NewBracketNode
): Promise<BracketNode> {
  try {
    if (!nodeData.phaseId || !nodeData.nodeCode) {
      throw new Error('phaseId and nodeCode are required');
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
    console.error('Error creating bracket node:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create bracket node');
  }
}

/**
 * Crée plusieurs nœuds de bracket en une seule transaction
 */
export async function bulkCreateBracketNodes(
  nodesData: (NewBracketNode & { editionId?: string })[]
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
          })
        )
        .returning();

      // Check for automatic match generation if participants are in metadata
      for (let i = 0; i < result.length; i++) {
        const node = result[i];
        const inputData = nodesData[i];
        const metadata = (node.metadata as any) || {};
        const participants = metadata.participants || [];
        const generateMatches = metadata.generateMatches !== false;
        
        if (participants.length >= 2 && inputData.editionId && generateMatches) {
           // Generate matches for this node
           // For now, simple BO1 generation between first two or all pairs if group matches
           const matchesToCreate = metadata.matchesCount || 1;
           const format = metadata.format || 'BEST_OF_1';

           const generated = generateGroupMatches(
              participants.map((id: string) => ({ id })),
              { returnType: format === 'HOME_AWAY' ? 'double' : 'single' }
           );

           for (const [idx, m] of generated.entries()) {
              await tx.insert(matches).values({
                editionId: inputData.editionId,
                phaseId: node.phaseId,
                groupId: node.groupId,
                bracketNodeId: node.id,
                participant1RegistrationId: m.participant1?.id,
                participant2RegistrationId: m.participant2?.id,
                matchCode: `${node.nodeCode || 'BR'}-M${idx + 1}`,
                status: 'PENDING',
                round: node.round || 1,
                matchNumber: idx + 1,
                metadata: { format },
                createdAt: new Date(),
                updatedAt: new Date(),
              } as any);
           }
        }
      }

      return result;
    });
  } catch (error) {
    console.error('Error bulk creating bracket nodes:', error);
    throw new Error('Failed to bulk create bracket nodes');
  }
}

/**
 * Met à jour un nœud de bracket
 */
export async function updateBracketNode(
  id: string,
  nodeData: Partial<NewBracketNode>
): Promise<BracketNode> {
  try {
    const existingNode = await getBracketNodeById(id);
    if (!existingNode) {
      throw new Error('Bracket node not found');
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
    console.error('Error updating bracket node:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update bracket node');
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
      throw new Error('Bracket node not found');
    }
    return result[0];
  } catch (error) {
    console.error('Error deleting bracket node:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete bracket node');
  }
}

/**
 * Crée un nouveau match
 */
export async function createMatch(matchData: NewMatch): Promise<Match> {
  try {
    if (!matchData.editionId || !matchData.phaseId) {
      throw new Error('editionId and phaseId are required');
    }

    if (
      matchData.participant1RegistrationId &&
      matchData.participant2RegistrationId &&
      matchData.participant1RegistrationId === matchData.participant2RegistrationId
    ) {
      throw new Error("Un participant ne peut pas jouer contre lui-même");
    }

    // Duplicate Check
    if (matchData.participant1RegistrationId && matchData.participant2RegistrationId) {
      const p1 = matchData.participant1RegistrationId;
      const p2 = matchData.participant2RegistrationId;
      
      const filterConditions = [
        eq(matches.editionId, matchData.editionId),
        eq(matches.phaseId, matchData.phaseId),
      ];
      
      if (matchData.groupId) filterConditions.push(eq(matches.groupId, matchData.groupId));
      if (matchData.bracketNodeId) filterConditions.push(eq(matches.bracketNodeId, matchData.bracketNodeId));

      const existingMatch = await db.query.matches.findFirst({
        where: and(
          ...filterConditions,
          or(
            and(
              eq(matches.participant1RegistrationId, p1),
              eq(matches.participant2RegistrationId, p2)
            ),
            and(
              eq(matches.participant1RegistrationId, p2),
              eq(matches.participant2RegistrationId, p1)
            )
          )
        )
      });
      
      if (existingMatch) {
         throw new Error("Ce match existe déjà pour ces deux participants dans cette phase/groupe.");
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
    console.error('Error creating match:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create match');
  }
}

/**
 * Crée plusieurs matchs en une seule transaction
 */
export async function bulkCreateMatches(
  matchesData: NewMatch[]
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
        }))
      )
      .returning();

    return result;
  } catch (error) {
    console.error('Error bulk creating matches:', error);
    throw new Error('Failed to bulk create matches');
  }
}

/**
 * Met à jour un match
 */
export async function updateMatch(
  id: string,
  matchData: Partial<NewMatch>
): Promise<Match> {
  try {
    const existingMatch = await getMatchById(id);
    if (!existingMatch) {
      throw new Error('Match not found');
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
    if (matchData.status === 'COMPLETED') {
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
    console.error('Error updating match:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update match');
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
      throw new Error('Match not found');
    }
    return result[0];
  } catch (error) {
    console.error('Error deleting match:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete match');
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
  options: QueryOptions = {}
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
  if (typeof filters.isActive === 'boolean') {
    conditions.push(eq(tournamentPhases.isActive, filters.isActive));
  }
  if (typeof filters.isCompleted === 'boolean') {
    conditions.push(eq(tournamentPhases.isCompleted, filters.isCompleted));
  }
  if (typeof filters.isDoubleElimination === 'boolean') {
    conditions.push(eq(tournamentPhases.isDoubleElimination, filters.isDoubleElimination));
  }
  if (typeof filters.isHidden === 'boolean') {
    conditions.push(eq(tournamentPhases.isHidden, filters.isHidden));
  }
  if (filters.orderMin !== undefined) {
    conditions.push(gte(tournamentPhases.order, filters.orderMin));
  }
  if (filters.orderMax !== undefined) {
    conditions.push(lte(tournamentPhases.order, filters.orderMax));
  }
  if (filters.scheduledStartFrom) {
    conditions.push(gte(tournamentPhases.scheduledStart, new Date(filters.scheduledStartFrom)));
  }
  if (filters.scheduledStartTo) {
    conditions.push(lte(tournamentPhases.scheduledStart, new Date(filters.scheduledStartTo)));
  }
  if (filters.scheduledEndFrom) {
    conditions.push(gte(tournamentPhases.scheduledEnd, new Date(filters.scheduledEndFrom)));
  }
  if (filters.scheduledEndTo) {
    conditions.push(lte(tournamentPhases.scheduledEnd, new Date(filters.scheduledEndTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les groupes de phase
 */
function buildPhaseGroupWhereConditions(
  filters: PhaseGroupFilters,
  options: QueryOptions = {}
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
  if (typeof filters.isCompleted === 'boolean') {
    conditions.push(eq(phaseGroups.isCompleted, filters.isCompleted));
  }
  if (typeof filters.isLocked === 'boolean') {
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
  options: QueryOptions = {}
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
    conditions.push(eq(phaseGroupParticipants.registrationId, filters.registrationId));
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
    conditions.push(gte(phaseGroupParticipants.matchesPlayed, filters.matchesPlayedMin));
  }
  if (filters.matchesPlayedMax !== undefined) {
    conditions.push(lte(phaseGroupParticipants.matchesPlayed, filters.matchesPlayedMax));
  }
  if (filters.matchesWonMin !== undefined) {
    conditions.push(gte(phaseGroupParticipants.matchesWon, filters.matchesWonMin));
  }
  if (filters.matchesWonMax !== undefined) {
    conditions.push(lte(phaseGroupParticipants.matchesWon, filters.matchesWonMax));
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
  options: QueryOptions = {}
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
  filters: MatchFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  if (!options.includeDeleted) {
    conditions.push(eq(matches.isDeleted, false));
  }

  if (filters.editionId) {
    conditions.push(eq(matches.editionId, filters.editionId));
  }
  if (filters.phaseId) {
    conditions.push(eq(matches.phaseId, filters.phaseId));
  }
  if (filters.groupId) {
    conditions.push(eq(matches.groupId, filters.groupId));
  }
  if (filters.bracketNodeId) {
    conditions.push(eq(matches.bracketNodeId, filters.bracketNodeId));
  }
  if (filters.matchCode) {
    conditions.push(eq(matches.matchCode, filters.matchCode));
  }
  if (filters.matchType) {
    if (Array.isArray(filters.matchType)) {
      conditions.push(inArray(matches.matchType, filters.matchType));
    } else {
      conditions.push(eq(matches.matchType, filters.matchType));
    }
  }
  if (filters.roundMin !== undefined) {
    conditions.push(gte(matches.round, filters.roundMin));
  }
  if (filters.roundMax !== undefined) {
    conditions.push(lte(matches.round, filters.roundMax));
  }
  if (filters.matchNumberMin !== undefined) {
    conditions.push(gte(matches.matchNumber, filters.matchNumberMin));
  }
  if (filters.matchNumberMax !== undefined) {
    conditions.push(lte(matches.matchNumber, filters.matchNumberMax));
  }
  if (filters.scheduledTimeFrom) {
    conditions.push(gte(matches.scheduledTime, new Date(filters.scheduledTimeFrom)));
  }
  if (filters.scheduledTimeTo) {
    conditions.push(lte(matches.scheduledTime, new Date(filters.scheduledTimeTo)));
  }
  if (filters.participant1RegistrationId) {
    conditions.push(eq(matches.participant1RegistrationId, filters.participant1RegistrationId));
  }
  if (filters.participant2RegistrationId) {
    conditions.push(eq(matches.participant2RegistrationId, filters.participant2RegistrationId));
  }
  if (filters.memberRegistrationId) {
    conditions.push(
      or(
        eq(matches.participant1RegistrationId, filters.memberRegistrationId),
        eq(matches.participant2RegistrationId, filters.memberRegistrationId)
      )
    );
  }
  if (filters.score1Min !== undefined) {
    conditions.push(gte(matches.score1, filters.score1Min));
  }
  if (filters.score1Max !== undefined) {
    conditions.push(lte(matches.score1, filters.score1Max));
  }
  if (filters.score2Min !== undefined) {
    conditions.push(gte(matches.score2, filters.score2Min));
  }
  if (filters.score2Max !== undefined) {
    conditions.push(lte(matches.score2, filters.score2Max));
  }
  if (filters.winnerRegistrationId) {
    conditions.push(eq(matches.winnerRegistrationId, filters.winnerRegistrationId));
  }
  if (filters.loserRegistrationId) {
    conditions.push(eq(matches.loserRegistrationId, filters.loserRegistrationId));
  }
  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(inArray(matches.status, filters.statuses));
  }
  if (filters.submittedByUserId) {
    conditions.push(eq(matches.submittedByUserId, filters.submittedByUserId));
  }
  if (typeof filters.disputed === 'boolean') {
    conditions.push(eq(matches.disputed, filters.disputed));
  }
  if (typeof filters.confirmedByAdmin === 'boolean') {
    conditions.push(eq(matches.confirmedByAdmin, filters.confirmedByAdmin));
  }
  if (typeof filters.confirmedByParticipant1 === 'boolean') {
    conditions.push(eq(matches.confirmedByParticipant1, filters.confirmedByParticipant1));
  }
  if (typeof filters.confirmedByParticipant2 === 'boolean') {
    conditions.push(eq(matches.confirmedByParticipant2, filters.confirmedByParticipant2));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}


/**
 * Recalcule les statistiques et le classement pour un groupe spécifique
 */
export async function recalculateGroupStandings(groupId: string): Promise<void> {
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
        eq(matches.confirmedByAdmin, true)
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
      if (!m.participant1RegistrationId || !m.participant2RegistrationId) continue;

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
        const participant = group.participants.find((p) => p.registrationId === regId);
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
    await db.update(phaseGroups)
      .set({ isLocked, updatedAt: new Date() })
      .where(eq(phaseGroups.id, groupId));
    
    revalidatePath(`/tournaments/dashboard`);
    return { success: true };
  } catch (error) {
    console.error("Error toggling group lock:", error);
    throw new Error("Erreur lors du changement de verrouillage du groupe");
  }
}

/**
 * Vérifie les entités non terminées d'une entité parente (Phase, Group, BracketNode)
 */
export async function checkPendingEntitiesAction(type: 'PHASE' | 'GROUP' | 'BRACKET_NODE', id: string) {
  const pendingEntities: string[] = [];
  
  try {
    if (type === 'PHASE') {
      // 1. Check all groups in this phase
      const groups = await db.query.phaseGroups.findMany({
        where: and(eq(phaseGroups.phaseId, id), eq(phaseGroups.isDeleted, false)),
      });
      for (const group of groups) {
        if (!(group as any).isCompleted) {
          pendingEntities.push(`Groupe: ${group.name} n'est pas terminé`);
        }
      }

      // 2. Check all matches directly linked to this phase (that are not in a group)
      const pendingMatches = await db.query.matches.findMany({
        where: and(
          eq(matches.phaseId, id),
          isNull(matches.groupId),
          eq(matches.isDeleted, false),
          not(inArray(matches.status, ['CANCELLED', 'COMPLETED']))
        ),
      });
      for (const match of pendingMatches) {
        pendingEntities.push(`Match: ${match.matchCode || match.id} n'est pas terminé`);
      }

      // 3. Check all bracket nodes directly in this phase
      const nodes = await db.query.bracketNodes.findMany({
        where: and(eq(bracketNodes.phaseId, id), eq(bracketNodes.isDeleted, false), isNull(bracketNodes.groupId)),
      });
      for (const node of nodes) {
        if (!(node as any).isCompleted) {
           const nodeMatches = await db.query.matches.findMany({
             where: and(eq(matches.bracketNodeId, node.id), eq(matches.isDeleted, false)),
           });
           const hasPending = nodeMatches.some(m => !['CANCELLED', 'COMPLETED'].includes(m.status || ''));
           if (hasPending) {
              pendingEntities.push(`Nœud: ${node.nodeCode || node.id} a des matches non terminés`);
           }
        }
      }
    } else if (type === 'GROUP') {
      // 1. Check all matches in this group (direct matches)
      const groupMatches = await db.query.matches.findMany({
        where: and(
          eq(matches.groupId, id),
          eq(matches.isDeleted, false),
          not(inArray(matches.status, ['CANCELLED', 'COMPLETED']))
        ),
      });
      for (const match of groupMatches) {
        pendingEntities.push(`Match: ${match.matchCode || match.id} n'est pas terminé`);
      }

      // 2. Check all bracket nodes in this group
      const nodes = await db.query.bracketNodes.findMany({
        where: and(eq(bracketNodes.groupId, id), eq(bracketNodes.isDeleted, false)),
      });

      for (const node of nodes) {
        if (!(node as any).isCompleted) {
           const nodeMatches = await db.query.matches.findMany({
             where: and(eq(matches.bracketNodeId, node.id), eq(matches.isDeleted, false))
           });
           
           const hasPending = nodeMatches.some(m => !['CANCELLED', 'COMPLETED'].includes(m.status || ''));
           if (hasPending) {
              pendingEntities.push(`Nœud ${node.nodeCode}: des matches sont en attente`);
           } else if (nodeMatches.length === 0) {
              pendingEntities.push(`Nœud: ${node.nodeCode} n'est pas terminé`);
           }
        }
      }

    } else if (type === 'BRACKET_NODE') {
      const nodeMatches = await db.query.matches.findMany({
        where: and(eq(matches.bracketNodeId, id), eq(matches.isDeleted, false)),
      });

      const pendingMatches = nodeMatches.filter(m => !['CANCELLED', 'COMPLETED'].includes(m.status || ''));
      for (const m of pendingMatches) {
        pendingEntities.push(`Match: ${m.matchCode || m.id}`);
      }
    }

    return { success: true, pendingEntities };
  } catch (error) {
    console.error("Error checking pending entities:", error);
    return { success: false, pendingEntities: [] };
  }
}

/**
 * Marque un groupe comme terminé avec qualification des participants
 */
export async function markGroupCompleteAction(groupId: string) {
  try {
    const group = await db.query.phaseGroups.findFirst({
      where: eq(phaseGroups.id, groupId),
      with: { participants: true }
    });
    if (!group) throw new Error("Groupe introuvable");

    // 1. Vérification des matches non terminés
    const pending = await checkPendingEntitiesAction('GROUP', groupId);
    if (pending.pendingEntities.length > 0) {
      return { success: false, error: "Certaines entités ne sont pas encore terminées.", pendingEntities: pending.pendingEntities };
    }

    // 2. Recalculer les classements finaux
    await recalculateGroupStandings(groupId);

    // 3. Qualifier les participants selon la config
    const config = (group.config as any) || {};
    const advanceCount = config.advanceCount || 2;

    const sortedParticipants = [...group.participants].sort((a, b) => {
       if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
       return ((b.scoreFor || 0) - (b.scoreAgainst || 0)) - ((a.scoreFor || 0) - (a.scoreAgainst || 0));
    });

    return await db.transaction(async (tx) => {
       for (let i = 0; i < sortedParticipants.length; i++) {
          const isQualified = i < advanceCount;
          await tx.update(phaseGroupParticipants)
            .set({ 
               qualified: isQualified, 
               position: i + 1,
               updatedAt: new Date()
            })
            .where(eq(phaseGroupParticipants.id, sortedParticipants[i].id));
       }

       // 4. Marquer comme terminé et verrouiller
       await tx.update(phaseGroups)
         .set({ isCompleted: true, isLocked: true, updatedAt: new Date() })
         .where(eq(phaseGroups.id, groupId));

       revalidatePath(`/tournaments/dashboard`);
       return { success: true, qualifiedCount: advanceCount };
    });
  } catch (error) {
    console.error("Error marking group complete:", error);
    throw error;
  }
}

/**
 * Marque une phase comme terminée
 */
export async function markPhaseCompleteAction(phaseId: string) {
  try {
    const phase = await db.query.tournamentPhases.findFirst({
      where: eq(tournamentPhases.id, phaseId),
    });
    if (!phase) throw new Error("Phase introuvable");

    // 1. Vérification des entités non terminées
    const pending = await checkPendingEntitiesAction('PHASE', phaseId);
    if (pending.pendingEntities.length > 0) {
      return { success: false, error: "Certaines entités ne sont pas encore terminées.", pendingEntities: pending.pendingEntities };
    }

    // 2. Si c'est la dernière phase, on peut marquer le gagnant de l'édition
    const nextPhase = await db.query.tournamentPhases.findFirst({
       where: and(
          eq(tournamentPhases.editionId, phase.editionId),
          gt(tournamentPhases.order, phase.order),
          eq(tournamentPhases.isDeleted, false)
       ),
       orderBy: asc(tournamentPhases.order)
    });

    return await db.transaction(async (tx) => {
       // Marquer la phase comme terminée
       await tx.update(tournamentPhases)
         .set({ isCompleted: true, isActive: false, updatedAt: new Date() })
         .where(eq(tournamentPhases.id, phaseId));

       // Verrouiller tous les groupes (au cas où ils ne l'étaient pas)
       await tx.update(phaseGroups)
         .set({ isLocked: true, isCompleted: true, updatedAt: new Date() })
         .where(eq(phaseGroups.phaseId, phaseId));

       // Si pas de phase suivante, l'édition est probablement terminée
       if (!nextPhase) {
          // Gérer le gagnant de l'édition ici
          // ... logic to update edition winner if applicable
       }

       revalidatePath(`/tournaments/dashboard`);
       return { success: true, isLastPhase: !nextPhase };
    });
  } catch (error) {
    console.error("Error marking phase complete:", error);
    throw error;
  }
}

/**
 * Marque un bracket node comme terminé et fait progresser le gagnant
 */
export async function markBracketNodeCompleteAction(nodeId: string) {
  try {
    const node = await db.query.bracketNodes.findFirst({
      where: eq(bracketNodes.id, nodeId),
      with: { parentNode: true }
    });
    if (!node) throw new Error("Bracket node introuvable");

    // 1. Vérification des matches non terminés
    const pending = await checkPendingEntitiesAction('BRACKET_NODE', nodeId);
    if (pending.pendingEntities.length > 0) {
      return { success: false, error: "Certaines entités ne sont pas encore terminées.", pendingEntities: pending.pendingEntities };
    }

    // 2. Déterminer le gagnant du node
    const nodeMatches = await db.query.matches.findMany({
      where: and(eq(matches.bracketNodeId, nodeId), eq(matches.status, 'COMPLETED'), eq(matches.confirmedByAdmin, true)),
    });

    if (nodeMatches.length === 0) {
       return { success: false, error: "Aucun match terminé trouvé pour ce node." };
    }

    // Calcul du gagnant global du node (si plusieurs matches, ex: BO3)
    const winCounts = new Map();
    for (const m of nodeMatches) {
       if (m.winnerRegistrationId) {
          winCounts.set(m.winnerRegistrationId, (winCounts.get(m.winnerRegistrationId) || 0) + 1);
       }
    }

    let winnerId = null;
    let maxWins = 0;
    for (const [regId, count] of winCounts.entries()) {
       if (count > maxWins) {
          maxWins = count;
          winnerId = regId;
       }
    }

    if (!winnerId) {
       return { success: false, error: "Impossible de déterminer le gagnant du node." };
    }

    return await db.transaction(async (tx) => {
       // 3. Faire progresser le gagnant vers le node parent si applicable
       if (node.parentNodeId) {
          const parentNode = node.parentNode;
          const parentMetadata = (parentNode?.metadata || {} as any) || {};
          const parentParticipants = parentMetadata.participants || [];
          
          if (!parentParticipants.includes(winnerId)) {
             await tx.update(bracketNodes)
               .set({ 
                  metadata: { 
                    ...parentMetadata, 
                    participants: [...parentParticipants, winnerId] 
                  },
                  updatedAt: new Date()
               })
               .where(eq(bracketNodes.id, node.parentNodeId));
          }
       }

       // 4. Marquer le node comme terminé
       await tx.update(bracketNodes)
         .set({ isCompleted: true, updatedAt: new Date() })
         .where(eq(bracketNodes.id, nodeId));

       revalidatePath(`/tournaments/dashboard`);
       return { success: true, winnerId };
    });
  } catch (error) {
    console.error("Error marking bracket node complete:", error);
    throw error;
  }
}

/**
 * Auto-génère la structure d'une phase (groupes, nodes, matches)
 */
export async function autoGeneratePhaseStructureAction(phaseId: string, config: {
  groupsCount?: number;
  participantsPerGroup?: number;
  seedingMethod: 'RANDOM' | 'SEQUENTIAL' | 'SNAKE';
  generateGroups: boolean;
  generateNodes: boolean;
  generateMatches: boolean;
  groupPrefix?: string;
  participantIds?: string[];
  isHomeAway?: boolean;
}) {
  try {
    const phase = await db.query.tournamentPhases.findFirst({
      where: eq(tournamentPhases.id, phaseId),
      with: { edition: true }
    });
    if (!phase) throw new Error("Phase introuvable");

    // 1. Récupérer les participants source
    let participants: string[] = config.participantIds || [];

    if (participants.length === 0) {
      const phaseConfig = (phase.config as any) || {};
      const source = phaseConfig.participantSource || 'EDITION';

      if (source.startsWith('PHASE_')) {
        const sourcePhaseId = source.replace('PHASE_', '');
        const sourceParticipants = await db.query.phaseGroupParticipants.findMany({
          where: and(
            exists(
              db.select().from(phaseGroups)
                .where(and(
                  eq(phaseGroups.id, phaseGroupParticipants.groupId),
                  eq(phaseGroups.phaseId, sourcePhaseId)
                ))
            ),
            eq(phaseGroupParticipants.qualified, true)
          )
        });
        participants = sourceParticipants.map(p => p.registrationId);
      } else {
        const regs = await db.query.editionRegistrations.findMany({
          where: and(
            eq(editionRegistrations.editionId, phase.editionId),
            eq(editionRegistrations.status, 'REGISTERED')
          )
        });
        participants = regs.map(r => r.id);
      }
    }

    if (participants.length === 0) {
       throw new Error("Aucun participant trouvé pour cette phase.");
    }

    // 2. Mélanger si random
    if (config.seedingMethod === 'RANDOM') {
       participants = shuffle(participants);
    }

    const participantsPerGroup = config.participantsPerGroup || 4;
    const groupsCount = config.groupsCount || Math.ceil(participants.length / participantsPerGroup);

    return await db.transaction(async (tx) => {
       // Si on ne génère pas de groupes, on traite la phase comme un bloc unique
       if (!config.generateGroups) {
          // Créer un node global pour la phase ? 
          // Pour l'élimination directe, on crée les nodes de Round 1
          if (phase.phaseType === 'ELIMINATION' || phase.phaseType === 'KNOCKOUT') {
             // ... logique élimination direct en bloc
          }
          return { success: true, message: "Phase initialisée sans groupes" };
       }

       // 3. Répartir en groupes
       const groups = chunk(participants, participantsPerGroup);
       let prefix = config.groupPrefix || "Groupe";
       
       for (let i = 0; i < Math.min(groups.length, groupsCount); i++) {
          const groupRegs = groups[i];
          
          let groupName = `${prefix} ${String.fromCharCode(65 + i)}`;
          if (phase.phaseType === 'ROUND_ROBIN') {
             groupName = groups.length === 1 ? "Classement" : `Ligue ${i + 1}`;
          } else if (phase.phaseType === 'SWISS') {
             groupName = "Système Suisse";
          }

          const [newGroup] = await tx.insert(phaseGroups).values({
             phaseId,
             name: groupName,
             order: i + 1,
             participantCount: groupRegs.length,
             groupType: phase.phaseType || 'STANDARD',
             config: {
                isHomeAway: config.isHomeAway || false,
                generateMatches: config.generateMatches
             },
             createdAt: new Date(),
             updatedAt: new Date(),
          }).returning();

          // Ajouter les participants au groupe
          for (let j = 0; j < groupRegs.length; j++) {
             await tx.insert(phaseGroupParticipants).values({
                groupId: newGroup.id,
                registrationId: groupRegs[j],
                position: j + 1,
                createdAt: new Date(),
                updatedAt: new Date(),
             });
          }

          if (config.generateNodes) {
            // Générer un node par défaut pour le groupe (ou plusieurs si expert)
            const [newNode] = await tx.insert(bracketNodes).values({
               phaseId,
               groupId: newGroup.id,
               nodeCode: `${newGroup.name}-N1`,
               round: 1,
               matchNumber: 1,
               metadata: {
                  participants: groupRegs,
                  name: "Général",
                  generateMatches: config.generateMatches,
                  matchesCount: 1,
                  format: 'BEST_OF_1'
               }
            } as any).returning();

            // Générer les matches si demandé
            if (config.generateMatches) {
               const returnType = config.isHomeAway ? 'double' : 'single';
               const generated = generateGroupMatches(groupRegs.map(id => ({ id })), { returnType });
               
               for (const [idx, m] of generated.entries()) {
                  await tx.insert(matches).values({
                     editionId: phase.editionId,
                     phaseId,
                     groupId: newGroup.id,
                     bracketNodeId: newNode.id,
                     participant1RegistrationId: m.participant1?.id,
                     participant2RegistrationId: m.participant2?.id,
                     matchCode: `${newNode.nodeCode}-M${idx + 1}`,
                     status: 'PENDING',
                     round: m.round || 1,
                     matchNumber: idx + 1,
                     createdAt: new Date(),
                     updatedAt: new Date(),
                  } as any);
               }
            }
          }
       }

       revalidatePath(`/tournaments/editions/${phase.editionId}/dashboard`);
       return { success: true, groupsCount: Math.min(groups.length, groupsCount) };
    });
  } catch (error) {
    console.error("Error auto generating phase structure:", error);
    throw error;
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
    // New hierarchical flags
    generateGroups?: boolean;
    generateNodes?: boolean;
    generateMatches?: boolean;
    isHomeAway?: boolean;
  } = {}
) {
  try {
    const edition = await db.query.tournamentEditions.findFirst({
      where: eq(tournamentEditions.id, editionId),
    });

    if (!edition) throw new Error("Édition introuvable");

    // 1. Validation de la capacité
    if (edition.maxParticipants && participantRegIds.length > edition.maxParticipants) {
      throw new Error(`Limite de participants atteinte (${participantRegIds.length}/${edition.maxParticipants})`);
    }

    return await db.transaction(async (tx) => {
      // 2. Création des phases
      const createdPhases = await tx
        .insert(tournamentPhases)
        .values(
          phasesData.map((p, idx) => ({
            ...p,
            editionId,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        )
        .returning();

      const firstPhase = createdPhases[0];
      
      // 3. Initialisation automatique de la Phase 1 si demandée
      if (options.autoInitializeFirstPhase && firstPhase && participantRegIds.length > 0) {
        const workingRegIds = options.randomizeDistribution !== false 
          ? shuffle([...participantRegIds]) 
          : [...participantRegIds];

        const generateGroups = options.generateGroups !== false;
        const generateNodes = options.generateNodes !== false;
        const generateMatches = options.generateMatches !== false;

        if (firstPhase.phaseType === 'GROUP_STAGE' || firstPhase.phaseType === 'ROUND_ROBIN' || firstPhase.phaseType === 'SWISS') {
          if (generateGroups) {
            const phaseConfig = (phasesData[0].config as any) || {};
            const groupSize = phaseConfig.groupsSize || options.groupsSize || 4;
            const groupsChunks = chunk(workingRegIds, groupSize);

            for (let i = 0; i < groupsChunks.length; i++) {
              const players = groupsChunks[i];
              
              // Créer le groupe
              let groupName = `Groupe ${String.fromCharCode(65 + i)}`;
              if (firstPhase.phaseType === 'ROUND_ROBIN') {
                 groupName = groupsChunks.length === 1 ? "Classement" : `Ligue ${i + 1}`;
              } else if (firstPhase.phaseType === 'SWISS') {
                 groupName = "Système Suisse";
              }

              const [group] = await tx
                .insert(phaseGroups)
                .values({
                  phaseId: firstPhase.id,
                  name: groupName,
                  order: i,
                  participantCount: players.length,
                  groupType: firstPhase.phaseType === 'ROUND_ROBIN' ? 'ROUND_ROBIN' : 'STANDARD',
                  config: {
                    isHomeAway: options.isHomeAway || false,
                    generateMatches: generateMatches
                  },
                  createdAt: new Date(),
                  updatedAt: new Date(),
                })
                .returning();

              // Assigner les participants au groupe
              await tx
                .insert(phaseGroupParticipants)
                .values(
                  players.map((regId) => ({
                    groupId: group.id,
                    registrationId: regId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  }))
                );

              if (generateNodes) {
                 const [node] = await tx.insert(bracketNodes).values({
                    phaseId: firstPhase.id,
                    groupId: group.id,
                    nodeCode: `${group.name.slice(0, 3).toUpperCase()}-N1`,
                    round: 1,
                    matchNumber: 1,
                    order: 0,
                    metadata: {
                      name: group.name,
                      participants: players,
                      generateMatches: generateMatches,
                      matchesCount: 1,
                      format: 'BEST_OF_1',
                      autoGenerated: true
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                 }).returning();

                 if (generateMatches) {
                    const returnType = options.isHomeAway ? 'double' : 'single';
                    const generated = generateGroupMatches(players.map(id => ({ id })), { returnType });
                    
                    for (const [idx, m] of generated.entries()) {
                       await tx.insert(matches).values({
                          editionId,
                          phaseId: firstPhase.id,
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
                       } as any);
                    }
                 }
              }
            }
          }
        } else if (firstPhase.phaseType === 'ELIMINATION') {
           const pairCount = Math.floor(workingRegIds.length / 2);
           
           for (let i = 0; i < pairCount; i++) {
             const p1 = workingRegIds[i * 2];
             const p2 = workingRegIds[i * 2 + 1];
             
             if (generateNodes) {
                // Créer le nœud
                const [node] = await tx
                  .insert(bracketNodes)
                  .values({
                    phaseId: firstPhase.id,
                    nodeCode: `R1-M${i + 1}`,
                    round: 1,
                    matchNumber: i + 1,
                    bracketType: 'UPPER',
                    order: i,
                    metadata: {
                      participants: [p1, p2],
                      requiresMatch: true,
                      generateMatches: generateMatches,
                      matchesCount: 1,
                      format: 'BEST_OF_1'
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  })
                  .returning();

                if (generateMatches) {
                   // Créer le match associé
                   await tx.insert(matches).values({
                      editionId,
                      phaseId: firstPhase.id,
                      bracketNodeId: node.id,
                      participant1RegistrationId: p1,
                      participant2RegistrationId: p2,
                      matchCode: `M${i + 1}`,
                      status: 'PENDING',
                      round: 1,
                      matchNumber: i + 1,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                   });
                }
             }
           }
        }
      }

      revalidatePath(`/tournaments/editions/${editionId}/dashboard`);
      return { success: true, phaseCount: createdPhases.length };
    });
  } catch (error: any) {
    console.error("Error organizing edition structure:", error);
    throw new Error(error.message || "Échec de l'organisation structurelle");
  }
}

