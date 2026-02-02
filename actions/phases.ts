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

    const whereConditions = buildTournamentPhaseWhereConditions(filters, options);

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

    const [phasesData, totalResult] = await Promise.all([phasesQuery, countQuery]);

    const total = totalResult[0]?.count || 0;
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
export async function deletePhaseGroupParticipant(id: string): Promise<PhaseGroupParticipant> {
  try {
    const result = await db
      .update(phaseGroupParticipants)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(phaseGroupParticipants.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Phase group participant not found');
    }
    return result[0];
  } catch (error) {
    console.error('Error deleting phase group participant:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete phase group participant');
  }
}

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

    return result[0];
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
