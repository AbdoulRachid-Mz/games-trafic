"use server";

import {
  tournaments,
  tournamentMembers,
  teams,
  teamMembers,
  type Tournament,
  type TournamentMember,
  type Team,
  type TeamMember,
  type NewTournamentMember,
  type NewTeamMember,
} from "@/database/schema";
import {
  eq,
  and,
  or,
  like,
  ilike,
  inArray,
  desc,
  asc,
  sql,
  count,
  gte,
  lte,
  isNull,
} from "drizzle-orm";
import {
  type TournamentFilters,
  type TournamentMemberFilters,
  type TeamFilters,
  type TeamMemberFilters,
  type ListQuery,
  type PaginationResponse,
  type QueryOptions,
} from "@/types/api";
import { db } from "@/lib/db";

// ============================================================================
// TOURNAMENT ACTIONS
// ============================================================================

/**
 * Récupère un tournoi par son ID avec relations optionnelles
 */
export async function getTournamentById(
  id: string,
  options?: { populate?: string[] },
): Promise<Tournament | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.tournaments.findFirst({
        where: (tournaments, { eq }) => eq(tournaments.id, id),
        with: {
          organizer: options.populate.includes("organizer") ? true : undefined,
          members: options.populate.includes("members") ? true : undefined,
          // phases: options.populate.includes("phases") ? true : undefined,
          notifications: options.populate.includes("notifications")
            ? true
            : undefined,
          interactions: options.populate.includes("interactions")
            ? true
            : undefined,
        },
      });
      return (await query) ?? null;
    }
    const result = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Error getting tournament by ID:", error);
    throw new Error("Failed to fetch tournament");
  }
}

/**
 * Liste les tournois avec pagination, filtres et options
 */
export async function getTournaments(
  query: ListQuery<TournamentFilters> = {},
): Promise<PaginationResponse<Tournament>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;
    const whereConditions = buildTournamentWhereConditions(filters, options);

    const tournamentsQuery = db
      .select()
      .from(tournaments)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof Tournament;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      tournamentsQuery.orderBy(sortOrder(tournaments[sortField]));
    } else {
      tournamentsQuery.orderBy(desc(tournaments.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(tournaments)
      .where(whereConditions);
    const [tournamentsData, totalResult] = await Promise.all([
      tournamentsQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: tournamentsData,
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
    console.error("Error getting tournaments:", error);
    throw new Error("Failed to fetch tournaments");
  }
}

/**
 * Crée un nouveau tournoi
 */
export async function createTournament(
  data: Omit<Tournament, "id" | "createdAt" | "updatedAt">,
): Promise<Tournament> {
  try {
    const result = await db
      .insert(tournaments)
      .values({ ...data, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Error creating tournament:", error);
    throw new Error("Failed to create tournament");
  }
}

/**
 * Met à jour un tournoi
 */
export async function updateTournament(
  id: string,
  data: Partial<Omit<Tournament, "id" | "createdAt">>,
): Promise<Tournament> {
  try {
    const result = await db
      .update(tournaments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tournaments.id, id))
      .returning();
    if (result.length === 0) throw new Error("Tournament not found");
    return result[0];
  } catch (error) {
    console.error("Error updating tournament:", error);
    if (error instanceof Error) throw error;
    throw new Error("Failed to update tournament");
  }
}

/**
 * Supprime un tournoi (soft delete)
 */
export async function deleteTournament(id: string): Promise<Tournament> {
  try {
    const result = await db
      .update(tournaments)
      .set({ isDeleted: true, isActive: false, updatedAt: new Date() })
      .where(eq(tournaments.id, id))
      .returning();
    if (result.length === 0) throw new Error("Tournament not found");
    return result[0];
  } catch (error) {
    console.error("Error deleting tournament:", error);
    if (error instanceof Error) throw error;
    throw new Error("Failed to delete tournament");
  }
}

// ============================================================================
// TOURNAMENT MEMBER ACTIONS
// ============================================================================

/**
 * Récupère un membre de tournoi par son ID
 */
export async function getTournamentMemberById(
  id: string,
): Promise<TournamentMember | null> {
  try {
    const result = await db
      .select()
      .from(tournamentMembers)
      .where(eq(tournamentMembers.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Error getting tournament member by ID:", error);
    throw new Error("Failed to fetch tournament member");
  }
}

/**
 * Liste les membres d'un tournoi avec pagination et filtres
 */
export async function getTournamentMembers(
  query: ListQuery<TournamentMemberFilters> = {},
): Promise<PaginationResponse<TournamentMember>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;
    const whereConditions = buildTournamentMemberWhereConditions(
      filters,
      options,
    );

    const membersQuery = db
      .select()
      .from(tournamentMembers)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof TournamentMember;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      membersQuery.orderBy(sortOrder(tournamentMembers[sortField]));
    } else {
      membersQuery.orderBy(desc(tournamentMembers.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(tournamentMembers)
      .where(whereConditions);
    const [membersData, totalResult] = await Promise.all([
      membersQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: membersData,
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
    console.error("Error getting tournament members:", error);
    throw new Error("Failed to fetch tournament members");
  }
}

/**
 * Ajoute un membre à un tournoi
 */
export async function addTournamentMember(
  data: NewTournamentMember,
): Promise<TournamentMember> {
  try {
    const result = await db.insert(tournamentMembers).values(data).returning();
    return result[0];
  } catch (error) {
    console.error("Error adding tournament member:", error);
    throw new Error("Failed to add tournament member");
  }
}

/**
 * Met à jour un membre de tournoi
 */
export async function updateTournamentMember(
  id: string,
  data: Partial<NewTournamentMember>,
): Promise<TournamentMember> {
  try {
    const result = await db
      .update(tournamentMembers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tournamentMembers.id, id))
      .returning();
    if (result.length === 0) throw new Error("Tournament member not found");
    return result[0];
  } catch (error) {
    console.error("Error updating tournament member:", error);
    if (error instanceof Error) throw error;
    throw new Error("Failed to update tournament member");
  }
}

/**
 * Supprime un membre de tournoi
 */
export async function removeTournamentMember(
  id: string,
): Promise<TournamentMember> {
  try {
    const result = await db
      .update(tournamentMembers)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(tournamentMembers.id, id))
      .returning();
    if (result.length === 0) throw new Error("Tournament member not found");
    return result[0];
  } catch (error) {
    console.error("Error removing tournament member:", error);
    if (error instanceof Error) throw error;
    throw new Error("Failed to remove tournament member");
  }
}

// ============================================================================
// TEAM ACTIONS
// ============================================================================

/**
 * Récupère une équipe par son ID avec relations optionnelles
 */
export async function getTeamById(
  id: string,
  options?: { populate?: string[] },
): Promise<Team | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.teams.findFirst({
        where: (teams, { eq }) => eq(teams.id, id),
        with: {
          captain: options.populate.includes("captain") ? true : undefined,
          viceCaptain: options.populate.includes("viceCaptain")
            ? true
            : undefined,
          members: options.populate.includes("members") ? true : undefined,
          tournamentMemberships: options.populate.includes(
            "tournamentMemberships",
          )
            ? true
            : undefined,
        },
      });
      return (await query) ?? null;
    }
    const result = await db
      .select()
      .from(teams)
      .where(eq(teams.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Error getting team by ID:", error);
    throw new Error("Failed to fetch team");
  }
}

/**
 * Liste les équipes avec pagination, filtres et options
 */
export async function getTeams(
  query: ListQuery<TeamFilters> = {},
): Promise<PaginationResponse<Team>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;
    const whereConditions = buildTeamWhereConditions(filters, options);

    const teamsQuery = db
      .select()
      .from(teams)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof Team;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      teamsQuery.orderBy(sortOrder(teams[sortField]));
    } else {
      teamsQuery.orderBy(desc(teams.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(teams)
      .where(whereConditions);
    const [teamsData, totalResult] = await Promise.all([
      teamsQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: teamsData,
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
    console.error("Error getting teams:", error);
    throw new Error("Failed to fetch teams");
  }
}

/**
 * Crée une nouvelle équipe
 */
export async function createTeam(
  data: Omit<Team, "id" | "createdAt" | "updatedAt">,
): Promise<Team> {
  try {
    const result = await db
      .insert(teams)
      .values({ ...data, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Error creating team:", error);
    throw new Error("Failed to create team");
  }
}

/**
 * Met à jour une équipe
 */
export async function updateTeam(
  id: string,
  data: Partial<Omit<Team, "id" | "createdAt">>,
): Promise<Team> {
  try {
    const result = await db
      .update(teams)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    if (result.length === 0) throw new Error("Team not found");
    return result[0];
  } catch (error) {
    console.error("Error updating team:", error);
    if (error instanceof Error) throw error;
    throw new Error("Failed to update team");
  }
}

/**
 * Supprime une équipe (soft delete)
 */
export async function deleteTeam(id: string): Promise<Team> {
  try {
    const result = await db
      .update(teams)
      .set({ isDeleted: true, isActive: false, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    if (result.length === 0) throw new Error("Team not found");
    return result[0];
  } catch (error) {
    console.error("Error deleting team:", error);
    if (error instanceof Error) throw error;
    throw new Error("Failed to delete team");
  }
}

// ============================================================================
// TEAM MEMBER ACTIONS
// ============================================================================

/**
 * Récupère un membre d'équipe par son ID
 */
export async function getTeamMemberById(
  id: string,
): Promise<TeamMember | null> {
  try {
    const result = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Error getting team member by ID:", error);
    throw new Error("Failed to fetch team member");
  }
}

/**
 * Liste les membres d'une équipe avec pagination et filtres
 */
export async function getTeamMembers(
  query: ListQuery<TeamMemberFilters> = {},
): Promise<PaginationResponse<TeamMember>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;
    const whereConditions = buildTeamMemberWhereConditions(filters, options);

    const membersQuery = db
      .select()
      .from(teamMembers)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof TeamMember;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      membersQuery.orderBy(sortOrder(teamMembers[sortField]));
    } else {
      membersQuery.orderBy(desc(teamMembers.joinedAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(teamMembers)
      .where(whereConditions);
    const [membersData, totalResult] = await Promise.all([
      membersQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: membersData,
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
    console.error("Error getting team members:", error);
    throw new Error("Failed to fetch team members");
  }
}

/**
 * Ajoute un membre à une équipe
 */
export async function addTeamMember(data: NewTeamMember): Promise<TeamMember> {
  try {
    const result = await db.insert(teamMembers).values(data).returning();
    return result[0];
  } catch (error) {
    console.error("Error adding team member:", error);
    throw new Error("Failed to add team member");
  }
}

/**
 * Met à jour un membre d'équipe
 */
export async function updateTeamMember(
  id: string,
  data: Partial<NewTeamMember>,
): Promise<TeamMember> {
  try {
    const result = await db
      .update(teamMembers)
      .set(data)
      .where(eq(teamMembers.id, id))
      .returning();
    if (result.length === 0) throw new Error("Team member not found");
    return result[0];
  } catch (error) {
    console.error("Error updating team member:", error);
    if (error instanceof Error) throw error;
    throw new Error("Failed to update team member");
  }
}

/**
 * Supprime un membre d'équipe
 */
export async function removeTeamMember(id: string): Promise<TeamMember> {
  try {
    const result = await db
      .delete(teamMembers)
      .where(eq(teamMembers.id, id))
      .returning();
    if (result.length === 0) throw new Error("Team member not found");
    return result[0];
  } catch (error) {
    console.error("Error removing team member:", error);
    if (error instanceof Error) throw error;
    throw new Error("Failed to remove team member");
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les tournois
 */
function buildTournamentWhereConditions(
  filters: TournamentFilters,
  options: QueryOptions = {},
) {
  const conditions = [];
  if (!options.includeDeleted)
    conditions.push(eq(tournaments.isDeleted, false));
  if (!options.includeInactive) conditions.push(eq(tournaments.isActive, true));

  if (filters.name)
    conditions.push(ilike(tournaments.name, `%${filters.name}%`));
  if (filters.game)
    conditions.push(ilike(tournaments.game, `%${filters.game}%`));
  if (filters.organizerId)
    conditions.push(eq(tournaments.organizerId, filters.organizerId));
  if (filters.platform?.length)
    conditions.push(inArray(tournaments.platform, filters.platform));
  if (filters.statuses?.length)
    conditions.push(inArray(tournaments.status, filters.statuses));
  if (filters.requiresAccessCode !== undefined)
    conditions.push(
      eq(tournaments.requiresAccessCode, filters.requiresAccessCode),
    );
  if (filters.themeId)
    conditions.push(eq(tournaments.themeId, filters.themeId));
  if (filters.visibility)
    conditions.push(eq(tournaments.visibility, filters.visibility));

  if (filters.maxParticipantsMin !== undefined)
    conditions.push(
      gte(tournaments.maxParticipantsPerEdition, filters.maxParticipantsMin),
    );
  if (filters.maxParticipantsMax !== undefined)
    conditions.push(
      lte(tournaments.maxParticipantsPerEdition, filters.maxParticipantsMax),
    );
  if (filters.currentParticipantsMin !== undefined)
    conditions.push(
      gte(
        sql`(SELECT COUNT(*) FROM edition_registrations er JOIN tournament_editions te ON er.edition_id = te.id WHERE te.tournament_id = ${tournaments.id} AND er.status = 'REGISTERED')`,
        filters.currentParticipantsMin,
      ),
    );
  if (filters.currentParticipantsMax !== undefined)
    conditions.push(
      lte(
        sql`(SELECT COUNT(*) FROM edition_registrations er JOIN tournament_editions te ON er.edition_id = te.id WHERE te.tournament_id = ${tournaments.id} AND er.status = 'REGISTERED')`,
        filters.currentParticipantsMax,
      ),
    );
  if (filters.totalParticipantsMin !== undefined)
    conditions.push(
      gte(tournaments.totalParticipants, filters.totalParticipantsMin),
    );
  if (filters.totalParticipantsMax !== undefined)
    conditions.push(
      lte(tournaments.totalParticipants, filters.totalParticipantsMax),
    );
  if (filters.prizePoolMin !== undefined)
    conditions.push(
      gte(
        sql`(SELECT COALESCE(SUM(prize_pool), 0) FROM tournament_editions WHERE tournament_id = ${tournaments.id})`,
        String(filters.prizePoolMin),
      ),
    );
  if (filters.prizePoolMax !== undefined)
    conditions.push(
      lte(
        sql`(SELECT COALESCE(SUM(prize_pool), 0) FROM tournament_editions WHERE tournament_id = ${tournaments.id})`,
        String(filters.prizePoolMax),
      ),
    );
  if (filters.totalPrizePoolMin !== undefined)
    conditions.push(
      gte(tournaments.totalPrizePool, String(filters.totalPrizePoolMin)),
    );
  if (filters.totalPrizePoolMax !== undefined)
    conditions.push(
      lte(tournaments.totalPrizePool, String(filters.totalPrizePoolMax)),
    );
  if (filters.viewCountMin !== undefined)
    conditions.push(gte(tournaments.viewCount, filters.viewCountMin));
  if (filters.viewCountMax !== undefined)
    conditions.push(lte(tournaments.viewCount, filters.viewCountMax));

  if (filters.startDateFrom)
    conditions.push(
      gte(
        sql`(SELECT MIN(start_date) FROM tournament_editions WHERE tournament_id = ${tournaments.id})`,
        new Date(filters.startDateFrom),
      ),
    );
  if (filters.startDateTo)
    conditions.push(
      lte(
        sql`(SELECT MIN(start_date) FROM tournament_editions WHERE tournament_id = ${tournaments.id})`,
        new Date(filters.startDateTo),
      ),
    );
  if (filters.endDateFrom)
    conditions.push(
      gte(
        sql`(SELECT MAX(end_date) FROM tournament_editions WHERE tournament_id = ${tournaments.id})`,
        new Date(filters.endDateFrom),
      ),
    );
  if (filters.endDateTo)
    conditions.push(
      lte(
        sql`(SELECT MAX(end_date) FROM tournament_editions WHERE tournament_id = ${tournaments.id})`,
        new Date(filters.endDateTo),
      ),
    );
  if (filters.registrationDeadlineFrom)
    conditions.push(
      gte(
        sql`(SELECT MIN(registration_deadline) FROM tournament_editions WHERE tournament_id = ${tournaments.id})`,
        new Date(filters.registrationDeadlineFrom),
      ),
    );
  if (filters.registrationDeadlineTo)
    conditions.push(
      lte(
        sql`(SELECT MIN(registration_deadline) FROM tournament_editions WHERE tournament_id = ${tournaments.id})`,
        new Date(filters.registrationDeadlineTo),
      ),
    );

  if (filters.createdFrom)
    conditions.push(gte(tournaments.createdAt, new Date(filters.createdFrom)));
  if (filters.createdTo)
    conditions.push(lte(tournaments.createdAt, new Date(filters.createdTo)));

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les membres de tournoi
 */
function buildTournamentMemberWhereConditions(
  filters: TournamentMemberFilters,
  options: QueryOptions = {},
) {
  const conditions = [];
  if (!options.includeDeleted)
    conditions.push(eq(tournamentMembers.isDeleted, false));

  if (filters.tournamentId)
    conditions.push(eq(tournamentMembers.tournamentId, filters.tournamentId));
  if (filters.userId)
    conditions.push(eq(tournamentMembers.userId, filters.userId));
  if (filters.teamId)
    conditions.push(eq(tournamentMembers.teamId, filters.teamId));
  if (filters.role) {
    if (Array.isArray(filters.role)) {
      conditions.push(inArray(tournamentMembers.role, filters.role));
    } else {
      conditions.push(eq(tournamentMembers.role, filters.role));
    }
  }
  if (filters.isCoOrganizer !== undefined)
    conditions.push(eq(tournamentMembers.isCoOrganizer, filters.isCoOrganizer));
  if (filters.isVerified !== undefined)
    conditions.push(eq(tournamentMembers.isVerified, filters.isVerified));
  if (filters.gameLevel)
    conditions.push(
      ilike(tournamentMembers.verificationLevel, `%${filters.gameLevel}%`),
    );
  if (filters.clubName)
    conditions.push(ilike(tournamentMembers.clubName, `%${filters.clubName}%`));
  if (filters.totalEditionsMin !== undefined)
    conditions.push(
      gte(tournamentMembers.totalEditions, filters.totalEditionsMin),
    );
  if (filters.totalEditionsMax !== undefined)
    conditions.push(
      lte(tournamentMembers.totalEditions, filters.totalEditionsMax),
    );
  if (filters.totalWinsMin !== undefined)
    conditions.push(gte(tournamentMembers.totalWins, filters.totalWinsMin));
  if (filters.totalWinsMax !== undefined)
    conditions.push(lte(tournamentMembers.totalWins, filters.totalWinsMax));
  if (filters.totalLossesMin !== undefined)
    conditions.push(gte(tournamentMembers.totalLosses, filters.totalLossesMin));
  if (filters.totalLossesMax !== undefined)
    conditions.push(lte(tournamentMembers.totalLosses, filters.totalLossesMax));
  if (filters.totalMatchesMin !== undefined)
    conditions.push(
      gte(tournamentMembers.totalMatches, filters.totalMatchesMin),
    );
  if (filters.totalMatchesMax !== undefined)
    conditions.push(
      lte(tournamentMembers.totalMatches, filters.totalMatchesMax),
    );
  if (filters.rankingPointsMin !== undefined)
    conditions.push(
      gte(tournamentMembers.rankingPoints, filters.rankingPointsMin),
    );
  if (filters.rankingPointsMax !== undefined)
    conditions.push(
      lte(tournamentMembers.rankingPoints, filters.rankingPointsMax),
    );

  if (filters.joinedFrom)
    conditions.push(
      gte(tournamentMembers.joinedAt, new Date(filters.joinedFrom)),
    );
  if (filters.joinedTo)
    conditions.push(
      lte(tournamentMembers.joinedAt, new Date(filters.joinedTo)),
    );
  if (filters.lastActiveFrom)
    conditions.push(
      gte(tournamentMembers.lastActive, new Date(filters.lastActiveFrom)),
    );
  if (filters.lastActiveTo)
    conditions.push(
      lte(tournamentMembers.lastActive, new Date(filters.lastActiveTo)),
    );

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les équipes
 */
function buildTeamWhereConditions(
  filters: TeamFilters,
  options: QueryOptions = {},
) {
  const conditions = [];
  if (!options.includeDeleted) conditions.push(eq(teams.isDeleted, false));
  if (!options.includeInactive) conditions.push(eq(teams.isActive, true));

  if (filters.name) conditions.push(ilike(teams.name, `%${filters.name}%`));
  if (filters.country)
    conditions.push(ilike(teams.country, `%${filters.country}%`));
  if (filters.city) conditions.push(ilike(teams.city, `%${filters.city}%`));
  if (filters.division)
    conditions.push(ilike(teams.division, `%${filters.division}%`));
  if (filters.captainId)
    conditions.push(eq(teams.captainId, filters.captainId));
  if (filters.viceCaptainId)
    conditions.push(eq(teams.viceCaptainId, filters.viceCaptainId));

  if (filters.foundedYearMin !== undefined)
    conditions.push(gte(teams.foundedYear, filters.foundedYearMin));
  if (filters.foundedYearMax !== undefined)
    conditions.push(lte(teams.foundedYear, filters.foundedYearMax));
  if (filters.rankingMin !== undefined)
    conditions.push(gte(teams.ranking, filters.rankingMin));
  if (filters.rankingMax !== undefined)
    conditions.push(lte(teams.ranking, filters.rankingMax));
  if (filters.maxSquadSizeMin !== undefined)
    conditions.push(gte(teams.maxSquadSize, filters.maxSquadSizeMin));
  if (filters.maxSquadSizeMax !== undefined)
    conditions.push(lte(teams.maxSquadSize, filters.maxSquadSizeMax));
  if (filters.currentSquadSizeMin !== undefined)
    conditions.push(gte(teams.currentSquadSize, filters.currentSquadSizeMin));
  if (filters.currentSquadSizeMax !== undefined)
    conditions.push(lte(teams.currentSquadSize, filters.currentSquadSizeMax));

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les membres d'équipe
 */
function buildTeamMemberWhereConditions(
  filters: TeamMemberFilters,
  options: QueryOptions = {},
) {
  const conditions = [];
  if (filters.isActive !== undefined)
    conditions.push(eq(teamMembers.isActive, filters.isActive));

  if (filters.teamId) conditions.push(eq(teamMembers.teamId, filters.teamId));
  if (filters.userId) conditions.push(eq(teamMembers.userId, filters.userId));
  if (filters.position)
    conditions.push(ilike(teamMembers.position, `%${filters.position}%`));
  if (filters.roles?.length)
    conditions.push(inArray(teamMembers.role, filters.roles));

  if (filters.joinedFrom)
    conditions.push(gte(teamMembers.joinedAt, new Date(filters.joinedFrom)));
  if (filters.joinedTo)
    conditions.push(lte(teamMembers.joinedAt, new Date(filters.joinedTo)));

  return conditions.length > 0 ? and(...conditions) : undefined;
}
