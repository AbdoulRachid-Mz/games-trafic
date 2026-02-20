// @/actions/tournaments.ts
"use server";

import {
  tournaments,
  tournamentEditions,
  tournamentMembers,
  tournamentPhases,
  phaseGroups,
  phaseGroupParticipants,
  bracketNodes,
  matches,
  editionRegistrations,
  registrationPayments,
  editionResults,
  teams,
  users,
  themes,
  interactions,
  notifications,
  walletTransactions,
  userWallets,
  financialAccounts,
  type Tournament,
  type NewTournament,
  type TournamentEdition,
  type NewTournamentEdition,
  type TournamentMember,
  type NewTournamentMember,
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
  type EditionRegistration,
  type NewEditionRegistration,
  type RegistrationPayment,
  type NewRegistrationPayment,
  type EditionResult,
  type NewEditionResult,
  TournamentWithRelations,
  TournamentEditionWithRelations,
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
} from "drizzle-orm";

import {
  type TournamentFilters,
  type TournamentEditionFilters,
  type TournamentMemberFilters,
  type TournamentPhaseFilters,
  type PhaseGroupFilters,
  type PhaseGroupParticipantFilters,
  type BracketNodeFilters,
  type MatchFilters,
  type EditionRegistrationFilters,
  type RegistrationPaymentFilters,
  type EditionResultFilters,
  type ListQuery,
  type PaginationResponse,
  type QueryOptions,
} from "@/types/api";

import { db } from "@/lib/db";

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère un tournoi par son ID avec relations optionnelles
 */
export async function getTournamentById(
  id: string,
  options?: { populate?: string[] }
): Promise<TournamentWithRelations | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.tournaments.findFirst({
        where: (tournaments, { eq }) => eq(tournaments.id, id),
        with: {
          organizer: options.populate.includes("organizer") ? true : undefined,
          members: options.populate.includes("members") ? true : undefined,
          editions: options.populate.includes("editions") ? true : undefined,
          theme: options.populate.includes("theme") ? {} : undefined,
        },
      });
      const result = await query;
      if (!result) return null;
      // Ensure theme is undefined when not populated or null to match TournamentWithRelations
      const { theme, ...rest } = result;
      return {
        ...rest,
        theme: options.populate.includes("theme")
          ? theme ?? undefined
          : undefined,
      } as TournamentWithRelations;
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
 * Récupère une édition par son ID avec relations optionnelles
 */
export async function getTournamentEditionById(
  id: string,
  options?: { populate?: string[] }
): Promise<TournamentEditionWithRelations | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.tournamentEditions.findFirst({
        where: (tournamentEditions, { eq }) => eq(tournamentEditions.id, id),
        with: {
          tournament: options.populate.includes("tournament")
            ? true
            : undefined,
          registrations: options.populate.includes("registrations")
            ? true
            : undefined,
          phases: options.populate.includes("phases") ? true : undefined,
          results: options.populate.includes("results") ? true : undefined,
        },
      });
      return (await query) ?? null;
    }
    const result = await db
      .select()
      .from(tournamentEditions)
      .where(eq(tournamentEditions.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Error getting tournament edition by ID:", error);
    throw new Error("Failed to fetch tournament edition");
  }
}

/**
 * Liste les tournois avec pagination, filtres et options
 */
export async function getTournaments(
  query: ListQuery<TournamentFilters> = {}
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
      .where(await whereConditions)
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
      .where(await whereConditions);

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
 * Récupère les tournois avec leurs éditions
 */
export async function getTournamentsWithEditions(
  limit: number = 100,
  sortBy: keyof Tournament = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
): Promise<Tournament[]> {
  try {
    const order = sortOrder === "desc" ? desc : asc;
    const result = await db.query.tournaments.findMany({
      limit,
      orderBy: order(tournaments[sortBy]),
      with: {
        editions: true,
      },
    });
    return result;
  } catch (error) {
    console.error("Error getting tournaments with editions:", error);
    throw new Error("Failed to fetch tournaments with editions");
  }
}

/**
 * Liste les éditions avec pagination, filtres et options
 */
export async function getTournamentEditions(
  query: ListQuery<TournamentEditionFilters> = {}
): Promise<PaginationResponse<TournamentEdition>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildTournamentEditionWhereConditions(
      filters,
      options
    );

    const editionsQuery = db
      .select()
      .from(tournamentEditions)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof TournamentEdition;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      editionsQuery.orderBy(sortOrder(tournamentEditions[sortField]));
    } else {
      editionsQuery.orderBy(desc(tournamentEditions.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(tournamentEditions)
      .where(whereConditions);

    const [editionsData, totalResult] = await Promise.all([
      editionsQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: editionsData,
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
    console.error("Error getting tournament editions:", error);
    throw new Error("Failed to fetch tournament editions");
  }
}

/**
 * Récupère les statistiques des tournois
 */
export async function getTournamentStats(filters?: TournamentFilters) {
  try {
    const whereConditions = buildTournamentWhereConditions(filters || {});

    const [
      totalResult,
      upcomingResult,
      liveResult,
      completedResult,
      cancelledResult,
      privateResult,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(tournaments)
        .where(await whereConditions),
      db
        .select({ count: count() })
        .from(tournaments)
        .where(and(await whereConditions, eq(tournaments.status, "UPCOMING"))),
      db
        .select({ count: count() })
        .from(tournaments)
        .where(and(await whereConditions, eq(tournaments.status, "LIVE"))),
      db
        .select({ count: count() })
        .from(tournaments)
        .where(and(await whereConditions, eq(tournaments.status, "COMPLETED"))),
      db
        .select({ count: count() })
        .from(tournaments)
        .where(and(await whereConditions, eq(tournaments.status, "CANCELLED"))),
      db
        .select({ count: count() })
        .from(tournaments)
        .where(
          and(await whereConditions, eq(tournaments.visibility, "PRIVATE"))
        ),
    ]);

    const stats = {
      total: totalResult[0]?.count ?? 0,
      upcoming: upcomingResult[0]?.count ?? 0,
      live: liveResult[0]?.count ?? 0,
      completed: completedResult[0]?.count ?? 0,
      cancelled: cancelledResult[0]?.count ?? 0,
      private: privateResult[0]?.count ?? 0,
    };

    return stats;
  } catch (error) {
    console.error("Error getting tournament stats:", error);
    throw new Error("Failed to fetch tournament statistics");
  }
}

// ============================================================================
// EDITION DETAIL TREE
// ============================================================================
export async function getEditionDetailTree(
  editionId: string,
  filters: {
    phases?: TournamentPhaseFilters;
    groups?: PhaseGroupFilters;
    bracketNodes?: BracketNodeFilters;
    matches?: MatchFilters;
  } = {},
  options: QueryOptions = {}
): Promise<any | null> {
  try {
    const edition = await db.query.tournamentEditions.findFirst({
      where: eq(tournamentEditions.id, editionId),
      with: {
        tournament: true,
        phases: {
          orderBy: (phases, { asc }) => [asc(phases.order)],
          with: {
            groups: {
              orderBy: (groups, { asc }) => [asc(groups.order)],
              with: {
                bracketNodes: true,
                participants: true,
              },
            },
            bracketNodes: true,
            matches: true,
          },
        },
        matches: true,
        registrations: true,
      },
    });

    if (!edition) return null;

    const filterPhase = (p: any) => {
      const f = filters.phases || {};
      if (options.includeDeleted !== true && p.isDeleted) return false;
      if (options.includeInactive !== true && p.isActive === false) return false;
      if (f.phaseType && Array.isArray(f.phaseType) && !f.phaseType.includes(p.phaseType)) return false;
      if (f.isCompleted !== undefined && p.isCompleted !== f.isCompleted) return false;
      if (f.isHidden !== undefined && p.isHidden !== f.isHidden) return false;
      if (f.orderMin !== undefined && p.order < f.orderMin) return false;
      if (f.orderMax !== undefined && p.order > f.orderMax) return false;
      return true;
    };

    const filterGroup = (g: any) => {
      const f = filters.groups || {};
      if (options.includeDeleted !== true && g.isDeleted) return false;
      if (f.groupType && Array.isArray(f.groupType) && !f.groupType.includes(g.groupType)) return false;
      if (f.isCompleted !== undefined && g.isCompleted !== f.isCompleted) return false;
      if (f.isLocked !== undefined && g.isLocked !== f.isLocked) return false;
      if (f.orderMin !== undefined && g.order < f.orderMin) return false;
      if (f.orderMax !== undefined && g.order > f.orderMax) return false;
      return true;
    };

    const filterNode = (n: any) => {
      const f = filters.bracketNodes || {};
      if (options.includeDeleted !== true && n.isDeleted) return false;
      if (f.bracketType && Array.isArray(f.bracketType) && !f.bracketType.includes(n.bracketType)) return false;
      if (f.roundMin !== undefined && (n.round ?? 0) < f.roundMin) return false;
      if (f.roundMax !== undefined && (n.round ?? 0) > f.roundMax) return false;
      if (f.matchNumberMin !== undefined && (n.matchNumber ?? 0) < f.matchNumberMin) return false;
      if (f.matchNumberMax !== undefined && (n.matchNumber ?? 0) > f.matchNumberMax) return false;
      if (f.depthMin !== undefined && (n.depth ?? 0) < f.depthMin) return false;
      if (f.depthMax !== undefined && (n.depth ?? 0) > f.depthMax) return false;
      return true;
    };

    const filterMatch = (m: any) => {
      const f = filters.matches || {};
      if (options.includeDeleted !== true && m.isDeleted) return false;
      if (f.statuses && Array.isArray(f.statuses) && !f.statuses.includes(m.status)) return false;
      if (f.matchType) {
        if (Array.isArray(f.matchType)) {
          if (!f.matchType.includes(m.matchType)) return false;
        } else if (m.matchType !== f.matchType) return false;
      }
      if (f.roundMin !== undefined && (m.round ?? 0) < f.roundMin) return false;
      if (f.roundMax !== undefined && (m.round ?? 0) > f.roundMax) return false;
      if (f.groupId && m.groupId !== f.groupId) return false;
      if (f.bracketNodeId && m.bracketNodeId !== f.bracketNodeId) return false;
      return true;
    };

    const phases = (edition.phases || []).filter(filterPhase).map((p: any) => {
      const groups = (p.groups || []).filter(filterGroup).map((g: any) => {
        const nodes = (g.bracketNodes || []).filter(filterNode);
        const participants = g.participants || [];
        return { ...g, bracketNodes: nodes, participants };
      });

      const phaseNodes = (p.bracketNodes || []).filter(filterNode);
      const phaseMatches = (p.matches || []).filter(filterMatch);
      return { ...p, groups, bracketNodes: phaseNodes, matches: phaseMatches };
    });

    const editionMatches = (edition.matches || []).filter(filterMatch);

    return {
      ...edition,
      phases,
      matches: editionMatches,
    };
  } catch (error) {
    console.error("Error building edition detail tree:", error);
    throw new Error("Failed to build edition detail tree");
  }
}
// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée un nouveau tournoi
 */
export async function createTournament(
  tournamentData: NewTournament
): Promise<Tournament> {
  try {
    if (
      !tournamentData.organizerId ||
      !tournamentData.name ||
      !tournamentData.game
    ) {
      throw new Error("organizerId, name and game are required");
    }

    const existingTournament = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.name, tournamentData.name))
      .limit(1);

    if (existingTournament.length > 0) {
      throw new Error("Tournament with this name already exists");
    }

    const result = await db
      .insert(tournaments)
      .values({
        ...tournamentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating tournament:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create tournament");
  }
}

/**
 * Crée une nouvelle édition de tournoi
 */
export async function createTournamentEdition(
  editionData: NewTournamentEdition
): Promise<TournamentEdition> {
  try {
    if (
      !editionData.tournamentId ||
      !editionData.editionNumber ||
      !editionData.startDate
    ) {
      throw new Error("tournamentId, editionNumber and startDate are required");
    }

    return await db.transaction(async (tx) => {
      // 1. Create Financial Account for Edition (Prize Pool)
      const [account] = await tx
        .insert(financialAccounts)
        .values({
          ownerEditionId: undefined, // Will link after edition is created
          type: 'TOURNAMENT_POOL',
          currency: editionData.prizeCurrency || 'GTC',
          isActive: true,
          createdAt: new Date(),
        })
        .returning();

      // 2. Create Edition
      const [newEdition] = await tx
        .insert(tournamentEditions)
        .values({
          ...editionData,
          financialAccountId: account.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // 3. Update Financial Account with ownerEditionId
      await tx
        .update(financialAccounts)
        .set({ ownerEditionId: newEdition.id })
        .where(eq(financialAccounts.id, account.id));

      return newEdition;
    });
  } catch (error) {
    console.error("Error creating tournament edition:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create tournament edition");
  }
}

/**
 * Met à jour un tournoi
 */
export async function updateTournament(
  id: string,
  tournamentData: Partial<NewTournament>
): Promise<Tournament> {
  try {
    const existingTournament = await getTournamentById(id);
    if (!existingTournament) {
      throw new Error("Tournament not found");
    }

    if (
      tournamentData.name &&
      tournamentData.name !== existingTournament.name
    ) {
      const tournamentWithName = await db
        .select()
        .from(tournaments)
        .where(eq(tournaments.name, tournamentData.name))
        .limit(1);
      if (tournamentWithName.length > 0) {
        throw new Error("Tournament name already exists");
      }
    }

    const result = await db
      .update(tournaments)
      .set({
        ...tournamentData,
        updatedAt: new Date(),
      })
      .where(eq(tournaments.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error updating tournament:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update tournament");
  }
}

/**
 * Met à jour une édition de tournoi
 */
export async function updateTournamentEdition(
  id: string,
  editionData: Partial<NewTournamentEdition>
): Promise<TournamentEdition> {
  try {
    const existingEdition = await getTournamentEditionById(id);
    if (!existingEdition) {
      throw new Error("Tournament edition not found");
    }

    const result = await db
      .update(tournamentEditions)
      .set({
        ...editionData,
        updatedAt: new Date(),
      })
      .where(eq(tournamentEditions.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error updating tournament edition:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update tournament edition");
  }
}

/**
 * Supprime un tournoi (soft delete)
 */
export async function deleteTournament(id: string): Promise<Tournament> {
  try {
    const result = await db
      .update(tournaments)
      .set({
        isDeleted: true,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(tournaments.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Tournament not found");
    }
    return result[0];
  } catch (error) {
    console.error("Error deleting tournament:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete tournament");
  }
}

/**
 * Supprime une édition de tournoi (soft delete)
 */
export async function deleteTournamentEdition(
  id: string
): Promise<TournamentEdition> {
  try {
    const result = await db
      .update(tournamentEditions)
      .set({
        isDeleted: true,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(tournamentEditions.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Tournament edition not found");
    }
    return result[0];
  } catch (error) {
    console.error("Error deleting tournament edition:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete tournament edition");
  }
}

/**
 * Restaure un tournoi supprimé
 */
export async function restoreTournament(id: string): Promise<Tournament> {
  try {
    const result = await db
      .update(tournaments)
      .set({
        isDeleted: false,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(tournaments.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Tournament not found");
    }
    return result[0];
  } catch (error) {
    console.error("Error restoring tournament:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to restore tournament");
  }
}

/**
 * Restaure une édition de tournoi supprimée
 */
export async function restoreTournamentEdition(
  id: string
): Promise<TournamentEdition> {
  try {
    const result = await db
      .update(tournamentEditions)
      .set({
        isDeleted: false,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(tournamentEditions.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Tournament edition not found");
    }
    return result[0];
  } catch (error) {
    console.error("Error restoring tournament edition:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to restore tournament edition");
  }
}

// ============================================================================
// TOURNAMENT MEMBERS
// ============================================================================

/**
 * Ajoute un membre à un tournoi
 */
/**
 * Ajoute un membre à un tournoi
 */
export async function addTournamentMember(
  memberData: NewTournamentMember
): Promise<TournamentMember> {
  try {
    if (!memberData.tournamentId) {
      throw new Error("tournamentId is required");
    }

    // 1. Strict Duplicate Check
    const conditions = [];

    // Check by User ID if provided
    if (memberData.userId) {
      conditions.push(eq(tournamentMembers.userId, memberData.userId));
    }

    // Check by Contact Email if provided (important for Guests)
    if (memberData.contactEmail) {
      conditions.push(
        eq(tournamentMembers.contactEmail, memberData.contactEmail)
      );
    }

    // Check by Contact Phone if provided
    if (memberData.contactPhone) {
      conditions.push(
        eq(tournamentMembers.contactPhone, memberData.contactPhone)
      );
    }

    // If no unique identifier is provided, we can't check for duplicates effectively,
    // but at least one should be present ideally.
    if (conditions.length > 0) {
      const existingMember = await db
        .select()
        .from(tournamentMembers)
        .where(
          and(
            eq(tournamentMembers.tournamentId, memberData.tournamentId),
            or(...conditions)
          )
        )
        .limit(1);

      if (existingMember.length > 0) {
        // We can be specific about why it failed if we want, but a generic message is safer
        throw new Error(
          "Member already exists in this tournament (same User, Email, or Phone)"
        );
      }
    }

    // 2. Ensure Team Existence (Auto-Create if missing)
    let teamId = memberData.teamId;

    if (!teamId) {
      // Create a new Team for this member (Guest Team or User Team)
      // Naming: "Guest - [Name]" or "[Username]"
      const teamName = memberData.displayName || "Guest Member " + Date.now();

      const newTeam = await db
        .insert(teams)
        .values({
          name: teamName + "-" + Math.floor(Math.random() * 10000), // Ensure uniqueness
          captainId: memberData.userId || undefined, // Set captain if user is real
          // logo: memberData.avatar, // Optional: propagate avatar
        })
        .returning();

      teamId = newTeam[0].id;
    }

    // 3. Insert Member
    const result = await db
      .insert(tournamentMembers)
      .values({
        ...memberData,
        teamId: teamId, // Enforce the team
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error: any) {
    console.error("Error adding tournament member:", error);
    // Return explicit error message if possible
    if (error.message && error.message.includes("Member already exists")) {
      throw error;
    }
    throw new Error(
      "Failed to add tournament member: " + (error.message || "Unknown error")
    );
  }
}

/**
 * Met à jour un membre de tournoi
 */
export async function updateTournamentMember(
  id: string,
  memberData: Partial<NewTournamentMember>
): Promise<TournamentMember> {
  try {
    const result = await db
      .update(tournamentMembers)
      .set({
        ...memberData,
        updatedAt: new Date(),
      })
      .where(eq(tournamentMembers.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Tournament member not found");
    }
    return result[0];
  } catch (error) {
    console.error("Error updating tournament member:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update tournament member");
  }
}

/**
 * Liste les membres d'un tournoi
 */
export async function getTournamentMembers(
  query: ListQuery<TournamentMemberFilters> = {}
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
      options
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

// ============================================================================
// TOURNAMENT PHASES
// ============================================================================

/**
 * Crée une phase de tournoi
 */
export async function createTournamentPhase(
  phaseData: NewTournamentPhase
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
 * Liste les phases d'un tournoi
 */
export async function getTournamentPhases(
  query: ListQuery<TournamentPhaseFilters> = {}
): Promise<PaginationResponse<TournamentPhase>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildTournamentPhaseWhereConditions(
      filters,
      options
    );

    const phasesQuery = db
      .select()
      .from(tournamentPhases)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset)
      .orderBy(asc(tournamentPhases.order));

    const countQuery = db
      .select({ count: count() })
      .from(tournamentPhases)
      .where(whereConditions);

    const [phasesData, totalResult] = await Promise.all([
      phasesQuery,
      countQuery,
    ]);

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
    console.error("Error getting tournament phases:", error);
    throw new Error("Failed to fetch tournament phases");
  }
}

// ============================================================================
// PHASE GROUPS
// ============================================================================

/**
 * Crée un groupe de phase
 */
export async function createPhaseGroup(
  groupData: NewPhaseGroup
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
 * Liste les groupes de phase
 */
export async function getPhaseGroups(
  query: ListQuery<PhaseGroupFilters> = {}
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
// PHASE GROUP PARTICIPANTS
// ============================================================================

/**
 * Ajoute un participant à un groupe de phase
 */
export async function addPhaseGroupParticipant(
  participantData: NewPhaseGroupParticipant
): Promise<PhaseGroupParticipant> {
  try {
    if (!participantData.groupId || !participantData.registrationId) {
      throw new Error("groupId and registrationId are required");
    }

    const existingParticipant = await db
      .select()
      .from(phaseGroupParticipants)
      .where(
        and(
          eq(phaseGroupParticipants.groupId, participantData.groupId),
          eq(
            phaseGroupParticipants.registrationId,
            participantData.registrationId
          )
        )
      )
      .limit(1);

    if (existingParticipant.length > 0) {
      throw new Error("Participant already exists in this group");
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
    console.error("Error adding phase group participant:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to add phase group participant");
  }
}

/**
 * Met à jour un participant de groupe de phase
 */
export async function updatePhaseGroupParticipant(
  id: string,
  participantData: Partial<NewPhaseGroupParticipant>
): Promise<PhaseGroupParticipant> {
  try {
    const result = await db
      .update(phaseGroupParticipants)
      .set({
        ...participantData,
        updatedAt: new Date(),
      })
      .where(eq(phaseGroupParticipants.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Phase group participant not found");
    }
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
 * Liste les participants de groupe de phase
 */
export async function getPhaseGroupParticipants(
  query: ListQuery<PhaseGroupParticipantFilters> = {}
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
      options
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

// ============================================================================
// BRACKET NODES
// ============================================================================

/**
 * Crée un nœud de bracket
 */
export async function createBracketNode(
  nodeData: NewBracketNode
): Promise<BracketNode> {
  try {
    if (!nodeData.phaseId) {
      throw new Error("phaseId is required");
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
 * Met à jour un nœud de bracket
 */
export async function updateBracketNode(
  id: string,
  nodeData: Partial<NewBracketNode>
): Promise<BracketNode> {
  try {
    const result = await db
      .update(bracketNodes)
      .set({
        ...nodeData,
        updatedAt: new Date(),
      })
      .where(eq(bracketNodes.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Bracket node not found");
    }
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
 * Liste les nœuds de bracket
 */
export async function getBracketNodes(
  query: ListQuery<BracketNodeFilters> = {}
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
// MATCHES
// ============================================================================

/**
 * Crée un match
 */
export async function createMatch(matchData: NewMatch): Promise<Match> {
  try {
    if (
      !matchData.editionId ||
      !matchData.phaseId ||
      matchData.round === undefined ||
      matchData.matchNumber === undefined
    ) {
      throw new Error("editionId, phaseId, round and matchNumber are required");
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

import { recalculateGroupStandings } from "./phases";

/**
 * Soumet un résultat de match par un participant ou un admin.
 */
export async function submitMatchResult(
  id: string,
  score1: number,
  score2: number,
  submittedByUserId: string,
  proofUrl?: string
): Promise<Match> {
  try {
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, id),
    });

    if (!match) throw new Error("Match not found");

    const updateData: any = {
      score1,
      score2,
      submittedByUserId,
      proofUrl,
      updatedAt: new Date(),
    };

    // Determine status and confirmations
    const isParticipant1 = match.participant1RegistrationId && await isUserRegistered(submittedByUserId, match.participant1RegistrationId);
    const isParticipant2 = match.participant2RegistrationId && await isUserRegistered(submittedByUserId, match.participant2RegistrationId);

    if (isParticipant1) {
      updateData.confirmedByParticipant1 = true;
      updateData.status = "PENDING_REVIEW";
    } else if (isParticipant2) {
      updateData.confirmedByParticipant2 = true;
      updateData.status = "PENDING_REVIEW";
    } else {
      // Admin submission
      updateData.status = "AWAITING_ADMIN_CONFIRMATION";
    }

    const result = await db
      .update(matches)
      .set(updateData)
      .where(eq(matches.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error submitting match result:", error);
    throw error;
  }
}

/**
 * Confirme un résultat de match par l'autre participant.
 */
export async function confirmMatchResult(
  id: string,
  registrationId: string
): Promise<Match> {
  try {
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, id),
    });

    if (!match) throw new Error("Match not found");

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (match.participant1RegistrationId === registrationId) {
      updateData.confirmedByParticipant1 = true;
    } else if (match.participant2RegistrationId === registrationId) {
      updateData.confirmedByParticipant2 = true;
    } else {
      throw new Error("Invalid participant for this match");
    }

    // If both confirmed, move to awaiting admin
    if ((updateData.confirmedByParticipant1 || match.confirmedByParticipant1) &&
      (updateData.confirmedByParticipant2 || match.confirmedByParticipant2)) {
      updateData.status = "AWAITING_ADMIN_CONFIRMATION";
    }

    const result = await db
      .update(matches)
      .set(updateData)
      .where(eq(matches.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error confirming match result:", error);
    throw error;
  }
}

/**
 * Validation finale par l'administrateur.
 */
export async function adminConfirmMatchResult(
  id: string,
  score1?: number,
  score2?: number
): Promise<Match> {
  try {
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, id),
    });

    if (!match) throw new Error("Match not found");

    const s1 = score1 ?? match.score1 ?? 0;
    const s2 = score2 ?? match.score2 ?? 0;

    // Determine winner
    let winnerId = null;
    let loserId = null;
    if (s1 > s2) {
      winnerId = match.participant1RegistrationId;
      loserId = match.participant2RegistrationId;
    } else if (s1 < s2) {
      winnerId = match.participant2RegistrationId;
      loserId = match.participant1RegistrationId;
    }

    const result = await db
      .update(matches)
      .set({
        score1: s1,
        score2: s2,
        winnerRegistrationId: winnerId,
        loserRegistrationId: loserId,
        status: "COMPLETED",
        confirmedByAdmin: true,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, id))
      .returning();

    const updatedMatch = result[0];

    // Trigger standings recalculation
    if (updatedMatch.groupId) {
      await recalculateGroupStandings(updatedMatch.groupId);
    }

    return updatedMatch;
  } catch (error) {
    console.error("Error admin confirming match result:", error);
    throw error;
  }
}

/**
 * Helper to check if a user is linked to a registration
 */
async function isUserRegistered(userId: string, registrationId: string): Promise<boolean> {
  const reg = await db.query.editionRegistrations.findFirst({
    where: eq(editionRegistrations.id, registrationId),
    with: {
      member: true,
    }
  });
  return reg?.member?.userId === userId;
}

/**
 * Met à jour les résultats d'un match (Legacy/Admin)
 */
export async function updateMatchResult(
  id: string,
  score1: number,
  score2: number,
  winnerRegistrationId: string,
  submittedByUserId: string
): Promise<Match> {
  return adminConfirmMatchResult(id, score1, score2);
}

/**
 * Liste les matches avec filtres
 */
export async function getMatches(
  query: ListQuery<MatchFilters> = {}
): Promise<PaginationResponse<Match>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildMatchWhereConditions(filters, options);

    const matchesData = await db.query.matches.findMany({
      where: whereConditions,
      limit: pagination.limit,
      offset: offset,
      orderBy: (matches, { asc, desc }) => {
        if (options.sortBy) {
          const sortField = options.sortBy as keyof Match;
          return options.sortOrder === "desc" ? [desc(matches[sortField])] : [asc(matches[sortField])];
        }
        return [desc(matches.createdAt)];
      },
      with: {
        participant1: {
          with: {
            member: {
              with: {
                user: true,
                team: true,
              },
            },
          },
        },
        participant2: {
          with: {
            member: {
              with: {
                user: true,
                team: true,
              },
            },
          },
        },
      },
    });

    const countResult = await db
      .select({ count: count() })
      .from(matches)
      .where(whereConditions);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: matchesData as any,
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

// ============================================================================
// EDITION REGISTRATIONS
// ============================================================================

/**
 * Crée une inscription à une édition
 */
export async function createEditionRegistration(
  registrationData: NewEditionRegistration
): Promise<EditionRegistration> {
  try {
    if (!registrationData.editionId || !registrationData.memberId) {
      throw new Error("editionId and memberId are required");
    }

    const existingRegistration = await db
      .select()
      .from(editionRegistrations)
      .where(
        and(
          eq(editionRegistrations.editionId, registrationData.editionId),
          eq(editionRegistrations.memberId, registrationData.memberId)
        )
      )
      .limit(1);

    if (existingRegistration.length > 0) {
      throw new Error("Registration already exists for this edition");
    }

    const result = await db
      .insert(editionRegistrations)
      .values({
        ...registrationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating edition registration:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create edition registration");
  }
}

/**
 * Met à jour une inscription à une édition
 */
export async function updateEditionRegistration(
  id: string,
  registrationData: Partial<NewEditionRegistration>
): Promise<EditionRegistration> {
  try {
    const result = await db
      .update(editionRegistrations)
      .set({
        ...registrationData,
        updatedAt: new Date(),
      })
      .where(eq(editionRegistrations.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Edition registration not found");
    }
    return result[0];
  } catch (error) {
    console.error("Error updating edition registration:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update edition registration");
  }
}

/**
 * Liste les inscriptions à une édition avec support des relations
 */
export async function getEditionRegistrations(
  query: ListQuery<EditionRegistrationFilters> = {}
): Promise<PaginationResponse<any>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildEditionRegistrationWhereConditions(
      filters,
      options
    );

    // If we have populates, we use the relational query API
    if (options.populate && options.populate.length > 0) {
      const registrationsData = await db.query.editionRegistrations.findMany({
        where: whereConditions,
        limit: pagination.limit,
        offset: offset,
        with: {
          member: options.populate.includes("member")
            ? {
              with: {
                user:
                  options.populate.includes("member.user") ||
                    options.populate.includes("user")
                    ? true
                    : undefined,
                team:
                  options.populate.includes("member.team") ||
                    options.populate.includes("team")
                    ? true
                    : undefined,
              },
            }
            : undefined,
          payment:
            options.populate.includes("payment") ||
              options.populate.includes("payments")
              ? {
                with: {
                  transaction: options.populate.includes(
                    "payment.transaction"
                  )
                    ? true
                    : undefined,
                },
              }
              : undefined,
          edition: options.populate.includes("edition") ? true : undefined,
        },
        orderBy: options.sortBy
          ? options.sortOrder === "desc"
            ? [
              desc(
                editionRegistrations[
                options.sortBy as keyof EditionRegistration
                ]
              ),
            ]
            : [
              asc(
                editionRegistrations[
                options.sortBy as keyof EditionRegistration
                ]
              ),
            ]
          : [desc(editionRegistrations.registeredAt)],
      });

      const totalResult = await db
        .select({ count: count() })
        .from(editionRegistrations)
        .where(whereConditions);

      const total = totalResult[0]?.count || 0;
      const totalPages = Math.ceil(total / pagination.limit);

      return {
        data: registrationsData,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1,
        },
      };
    }

    // Standard select for better performance if no relations needed
    const registrationsQuery = db
      .select()
      .from(editionRegistrations)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof EditionRegistration;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      registrationsQuery.orderBy(sortOrder(editionRegistrations[sortField]));
    } else {
      registrationsQuery.orderBy(desc(editionRegistrations.registeredAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(editionRegistrations)
      .where(whereConditions);

    const [registrationsData, totalResult] = await Promise.all([
      registrationsQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: registrationsData,
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
    console.error("Error getting edition registrations:", error);
    throw new Error("Failed to fetch edition registrations");
  }
}

// ============================================================================
// REGISTRATION PAYMENTS
// ============================================================================

/**
 * Crée un paiement d'inscription
 */
export async function createRegistrationPayment(
  paymentData: NewRegistrationPayment
): Promise<RegistrationPayment> {
  try {
    if (!paymentData.registrationId || !paymentData.transactionId) {
      throw new Error("registrationId and transactionId are required");
    }

    const result = await db
      .insert(registrationPayments)
      .values({
        ...paymentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating registration payment:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create registration payment");
  }
}


/**
 * Met à jour un paiement d'inscription
 */
export async function updateRegistrationPayment(
  id: string,
  paymentData: Partial<NewRegistrationPayment>
): Promise<RegistrationPayment> {
  try {
    const result = await db
      .update(registrationPayments)
      .set({
        ...paymentData,
        updatedAt: new Date(),
      })
      .where(eq(registrationPayments.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Registration payment not found");
    }
    return result[0];
  } catch (error) {
    console.error("Error updating registration payment:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update registration payment");
  }
}

/**
 * Liste les paiements d'inscription avec support des relations
 */
export async function getRegistrationPayments(
  query: ListQuery<RegistrationPaymentFilters> = {}
): Promise<PaginationResponse<any>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildRegistrationPaymentWhereConditions(
      filters,
      options
    );

    // If we have populates, we use the relational query API
    if (options.populate && options.populate.length > 0) {
      const paymentsData = await db.query.registrationPayments.findMany({
        where: whereConditions,
        limit: pagination.limit,
        offset: offset,
        with: {
          registration: options.populate.includes("registration")
            ? {
              with: {
                member:
                  options.populate.includes("registration.member") ||
                    options.populate.includes("member")
                    ? {
                      with: {
                        user:
                          options.populate.includes("member.user") ||
                            options.populate.includes("user")
                            ? true
                            : undefined,
                      },
                    }
                    : undefined,
                edition:
                  options.populate.includes("registration.edition") ||
                    options.populate.includes("edition")
                    ? true
                    : undefined,
              },
            }
            : undefined,
          transaction: options.populate.includes("transaction")
            ? true
            : undefined,
        },
        orderBy: options.sortBy
          ? options.sortOrder === "desc"
            ? [
              desc(
                registrationPayments[
                options.sortBy as keyof RegistrationPayment
                ]
              ),
            ]
            : [
              asc(
                registrationPayments[
                options.sortBy as keyof RegistrationPayment
                ]
              ),
            ]
          : [desc(registrationPayments.paidAt)],
      });

      const totalResult = await db
        .select({ count: count() })
        .from(registrationPayments)
        .where(whereConditions);

      const total = totalResult[0]?.count || 0;
      const totalPages = Math.ceil(total / pagination.limit);

      return {
        data: paymentsData,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1,
        },
      };
    }

    const paymentsQuery = db
      .select()
      .from(registrationPayments)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof RegistrationPayment;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      paymentsQuery.orderBy(sortOrder(registrationPayments[sortField]));
    } else {
      paymentsQuery.orderBy(desc(registrationPayments.paidAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(registrationPayments)
      .where(whereConditions);

    const [paymentsData, totalResult] = await Promise.all([
      paymentsQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: paymentsData,
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
    console.error("Error getting registration payments:", error);
    throw new Error("Failed to fetch registration payments");
  }
}

// ============================================================================
// EDITION RESULTS
// ============================================================================

/**
 * Crée un résultat d'édition
 */
export async function createEditionResult(
  resultData: NewEditionResult
): Promise<EditionResult> {
  try {
    if (
      !resultData.editionId ||
      !resultData.registrationId ||
      resultData.position === undefined
    ) {
      throw new Error("editionId, registrationId and position are required");
    }

    const existingResult = await db
      .select()
      .from(editionResults)
      .where(
        and(
          eq(editionResults.editionId, resultData.editionId),
          eq(editionResults.registrationId, resultData.registrationId)
        )
      )
      .limit(1);

    if (existingResult.length > 0) {
      throw new Error("Result already exists for this registration");
    }

    const result = await db
      .insert(editionResults)
      .values({
        ...resultData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating edition result:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create edition result");
  }
}

/**
 * Met à jour un résultat d'édition
 */
export async function updateEditionResult(
  id: string,
  resultData: Partial<NewEditionResult>
): Promise<EditionResult> {
  try {
    const result = await db
      .update(editionResults)
      .set({
        ...resultData,
        updatedAt: new Date(),
      })
      .where(eq(editionResults.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Edition result not found");
    }
    return result[0];
  } catch (error) {
    console.error("Error updating edition result:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update edition result");
  }
}

/**
 * Liste les résultats d'édition
 */
export async function getEditionResults(
  query: ListQuery<EditionResultFilters> = {}
): Promise<PaginationResponse<EditionResult>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildEditionResultWhereConditions(filters, options);

    const resultsQuery = db
      .select()
      .from(editionResults)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof EditionResult;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      resultsQuery.orderBy(sortOrder(editionResults[sortField]));
    } else {
      resultsQuery.orderBy(asc(editionResults.position));
    }

    const countQuery = db
      .select({ count: count() })
      .from(editionResults)
      .where(whereConditions);

    const [resultsData, totalResult] = await Promise.all([
      resultsQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: resultsData,
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
    console.error("Error getting edition results:", error);
    throw new Error("Failed to fetch edition results");
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les tournois
 */

export async function buildTournamentWhereConditions(
  filters: TournamentFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  if (!options.includeDeleted) {
    conditions.push(eq(tournaments.isDeleted, false));
  }
  if (!options.includeInactive) {
    conditions.push(eq(tournaments.isActive, true));
  }

  if (filters.id) conditions.push(eq(tournaments.id, filters.id));
  if (filters.organizerId)
    conditions.push(eq(tournaments.organizerId, filters.organizerId));
  if (filters.name)
    conditions.push(ilike(tournaments.name, `%${filters.name}%`));
  if (filters.game)
    conditions.push(ilike(tournaments.game, `%${filters.game}%`));
  if (filters.platform && filters.platform.length > 0) {
    conditions.push(inArray(tournaments.platform, filters.platform));
  }
  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(inArray(tournaments.status, filters.statuses));
  }
  if (filters.visibility)
    conditions.push(eq(tournaments.visibility, filters.visibility));
  if (filters.requiresAccessCode !== undefined) {
    conditions.push(
      eq(tournaments.requiresAccessCode, filters.requiresAccessCode)
    );
  }
  if (filters.themeId)
    conditions.push(eq(tournaments.themeId, filters.themeId));

  if (filters.maxParticipantsPerEditionMin !== undefined) {
    conditions.push(
      gte(
        tournaments.maxParticipantsPerEdition,
        filters.maxParticipantsPerEditionMin
      )
    );
  }
  if (filters.maxParticipantsPerEditionMax !== undefined) {
    conditions.push(
      lte(
        tournaments.maxParticipantsPerEdition,
        filters.maxParticipantsPerEditionMax
      )
    );
  }
  if (filters.totalParticipantsMin !== undefined) {
    conditions.push(
      gte(tournaments.totalParticipants, filters.totalParticipantsMin)
    );
  }
  if (filters.totalParticipantsMax !== undefined) {
    conditions.push(
      lte(tournaments.totalParticipants, filters.totalParticipantsMax)
    );
  }
  if (filters.totalPrizePoolMin !== undefined) {
    conditions.push(
      gte(tournaments.totalPrizePool, String(filters.totalPrizePoolMin))
    );
  }
  if (filters.totalPrizePoolMax !== undefined) {
    conditions.push(
      lte(tournaments.totalPrizePool, String(filters.totalPrizePoolMax))
    );
  }
  if (filters.viewCountMin !== undefined) {
    conditions.push(gte(tournaments.viewCount, filters.viewCountMin));
  }
  if (filters.viewCountMax !== undefined) {
    conditions.push(lte(tournaments.viewCount, filters.viewCountMax));
  }

  if (filters.createdFrom) {
    conditions.push(gte(tournaments.createdAt, new Date(filters.createdFrom)));
  }
  if (filters.createdTo) {
    conditions.push(lte(tournaments.createdAt, new Date(filters.createdTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les éditions de tournoi
 */
function buildTournamentEditionWhereConditions(
  filters: TournamentEditionFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  if (!options.includeDeleted) {
    conditions.push(eq(tournamentEditions.isDeleted, false));
  }
  if (!options.includeInactive) {
    conditions.push(eq(tournamentEditions.isActive, true));
  }

  if (filters.id) conditions.push(eq(tournamentEditions.id, filters.id));
  if (filters.tournamentId)
    conditions.push(eq(tournamentEditions.tournamentId, filters.tournamentId));
  if (filters.name)
    conditions.push(ilike(tournamentEditions.name, `%${filters.name}%`));
  if (filters.tagline)
    conditions.push(ilike(tournamentEditions.tagline, `%${filters.tagline}%`));
  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(inArray(tournamentEditions.status, filters.statuses));
  }
  if (filters.entryFeeMin !== undefined) {
    conditions.push(
      gte(tournamentEditions.entryFee, String(filters.entryFeeMin))
    );
  }
  if (filters.entryFeeMax !== undefined) {
    conditions.push(
      lte(tournamentEditions.entryFee, String(filters.entryFeeMax))
    );
  }
  if (filters.locationType) {
    if (Array.isArray(filters.locationType)) {
      conditions.push(
        inArray(tournamentEditions.locationType, filters.locationType)
      );
    } else {
      conditions.push(
        eq(tournamentEditions.locationType, filters.locationType)
      );
    }
  }

  if (filters.maxParticipantsMin !== undefined) {
    conditions.push(
      gte(tournamentEditions.maxParticipants, filters.maxParticipantsMin)
    );
  }
  if (filters.maxParticipantsMax !== undefined) {
    conditions.push(
      lte(tournamentEditions.maxParticipants, filters.maxParticipantsMax)
    );
  }
  if (filters.currentParticipantsMin !== undefined) {
    conditions.push(
      gte(
        tournamentEditions.currentParticipants,
        filters.currentParticipantsMin
      )
    );
  }
  if (filters.currentParticipantsMax !== undefined) {
    conditions.push(
      lte(
        tournamentEditions.currentParticipants,
        filters.currentParticipantsMax
      )
    );
  }
  if (filters.onlyAvailable === true) {
    conditions.push(
      sql`${tournamentEditions.currentParticipants} < ${tournamentEditions.maxParticipants}`
    );
  }
  if (filters.prizePoolMin !== undefined) {
    conditions.push(
      gte(tournamentEditions.prizePool, String(filters.prizePoolMin))
    );
  }
  if (filters.prizePoolMax !== undefined) {
    conditions.push(
      lte(tournamentEditions.prizePool, String(filters.prizePoolMax))
    );
  }
  if (filters.viewCountMin !== undefined) {
    conditions.push(gte(tournamentEditions.viewCount, filters.viewCountMin));
  }
  if (filters.viewCountMax !== undefined) {
    conditions.push(lte(tournamentEditions.viewCount, filters.viewCountMax));
  }

  if (filters.startDateFrom) {
    conditions.push(
      gte(tournamentEditions.startDate, new Date(filters.startDateFrom))
    );
  }
  if (filters.startDateTo) {
    conditions.push(
      lte(tournamentEditions.startDate, new Date(filters.startDateTo))
    );
  }
  if (filters.endDateFrom) {
    conditions.push(
      gte(tournamentEditions.endDate, new Date(filters.endDateFrom))
    );
  }
  if (filters.endDateTo) {
    conditions.push(
      lte(tournamentEditions.endDate, new Date(filters.endDateTo))
    );
  }
  if (filters.registrationOpensFrom) {
    conditions.push(
      gte(
        tournamentEditions.registrationOpens,
        new Date(filters.registrationOpensFrom)
      )
    );
  }
  if (filters.registrationOpensTo) {
    conditions.push(
      lte(
        tournamentEditions.registrationOpens,
        new Date(filters.registrationOpensTo)
      )
    );
  }
  if (filters.registrationDeadlineFrom) {
    conditions.push(
      gte(
        tournamentEditions.registrationDeadline,
        new Date(filters.registrationDeadlineFrom)
      )
    );
  }
  if (filters.registrationDeadlineTo) {
    conditions.push(
      lte(
        tournamentEditions.registrationDeadline,
        new Date(filters.registrationDeadlineTo)
      )
    );
  }
  if (filters.createdFrom) {
    conditions.push(
      gte(tournamentEditions.createdAt, new Date(filters.createdFrom))
    );
  }
  if (filters.createdTo) {
    conditions.push(
      lte(tournamentEditions.createdAt, new Date(filters.createdTo))
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les membres de tournoi
 */
function buildTournamentMemberWhereConditions(
  filters: TournamentMemberFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  if (!options.includeDeleted) {
    conditions.push(eq(tournamentMembers.isDeleted, false));
  }

  if (filters.id) conditions.push(eq(tournamentMembers.id, filters.id));
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
  if (filters.isCoOrganizer !== undefined) {
    conditions.push(eq(tournamentMembers.isCoOrganizer, filters.isCoOrganizer));
  }
  if (filters.isVerified !== undefined) {
    conditions.push(eq(tournamentMembers.isVerified, filters.isVerified));
  }
  if (filters.isBanned !== undefined) {
    conditions.push(eq(tournamentMembers.isBanned, filters.isBanned));
  }
  if (filters.verificationLevel) {
    if (Array.isArray(filters.verificationLevel)) {
      conditions.push(
        inArray(tournamentMembers.verificationLevel, filters.verificationLevel)
      );
    } else {
      conditions.push(
        eq(tournamentMembers.verificationLevel, filters.verificationLevel)
      );
    }
  }
  if (filters.statuses && filters.statuses.length > 0) {
    // Map string statuses to boolean values expected by isActive column
    const statusBooleans = filters.statuses.map(
      (status) => status === "active"
    );
    conditions.push(inArray(tournamentMembers.isActive, statusBooleans));
  }

  if (filters.rankingPointsMin !== undefined) {
    conditions.push(
      gte(tournamentMembers.rankingPoints, filters.rankingPointsMin)
    );
  }
  if (filters.rankingPointsMax !== undefined) {
    conditions.push(
      lte(tournamentMembers.rankingPoints, filters.rankingPointsMax)
    );
  }
  if (filters.totalWinsMin !== undefined) {
    conditions.push(gte(tournamentMembers.totalWins, filters.totalWinsMin));
  }
  if (filters.totalWinsMax !== undefined) {
    conditions.push(lte(tournamentMembers.totalWins, filters.totalWinsMax));
  }
  if (filters.totalLossesMin !== undefined) {
    conditions.push(gte(tournamentMembers.totalLosses, filters.totalLossesMin));
  }
  if (filters.totalLossesMax !== undefined) {
    conditions.push(lte(tournamentMembers.totalLosses, filters.totalLossesMax));
  }
  if (filters.winRateMin !== undefined) {
    conditions.push(gte(tournamentMembers.winRate, String(filters.winRateMin)));
  }
  if (filters.winRateMax !== undefined) {
    conditions.push(lte(tournamentMembers.winRate, String(filters.winRateMax)));
  }

  if (filters.joinedFrom) {
    conditions.push(
      gte(tournamentMembers.joinedAt, new Date(filters.joinedFrom))
    );
  }
  if (filters.joinedTo) {
    conditions.push(
      lte(tournamentMembers.joinedAt, new Date(filters.joinedTo))
    );
  }
  if (filters.lastActiveFrom) {
    conditions.push(
      gte(tournamentMembers.lastActive, new Date(filters.lastActiveFrom))
    );
  }
  if (filters.lastActiveTo) {
    conditions.push(
      lte(tournamentMembers.lastActive, new Date(filters.lastActiveTo))
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

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
  if (!options.includeInactive) {
    conditions.push(eq(tournamentPhases.isActive, true));
  }

  if (filters.id) conditions.push(eq(tournamentPhases.id, filters.id));
  if (filters.editionId)
    conditions.push(eq(tournamentPhases.editionId, filters.editionId));
  if (filters.name)
    conditions.push(ilike(tournamentPhases.name, `%${filters.name}%`));
  if (filters.phaseType && filters.phaseType.length > 0) {
    conditions.push(inArray(tournamentPhases.phaseType, filters.phaseType));
  }
  if (filters.isActive !== undefined) {
    conditions.push(eq(tournamentPhases.isActive, filters.isActive));
  }
  if (filters.isCompleted !== undefined) {
    conditions.push(eq(tournamentPhases.isCompleted, filters.isCompleted));
  }
  if (filters.isDoubleElimination !== undefined) {
    conditions.push(
      eq(tournamentPhases.isDoubleElimination, filters.isDoubleElimination)
    );
  }
  if (filters.isHidden !== undefined) {
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
      gte(tournamentPhases.scheduledStart, new Date(filters.scheduledStartFrom))
    );
  }
  if (filters.scheduledStartTo) {
    conditions.push(
      lte(tournamentPhases.scheduledStart, new Date(filters.scheduledStartTo))
    );
  }
  if (filters.scheduledEndFrom) {
    conditions.push(
      gte(tournamentPhases.scheduledEnd, new Date(filters.scheduledEndFrom))
    );
  }
  if (filters.scheduledEndTo) {
    conditions.push(
      lte(tournamentPhases.scheduledEnd, new Date(filters.scheduledEndTo))
    );
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

  if (filters.id) conditions.push(eq(phaseGroups.id, filters.id));
  if (filters.phaseId)
    conditions.push(eq(phaseGroups.phaseId, filters.phaseId));
  if (filters.name)
    conditions.push(ilike(phaseGroups.name, `%${filters.name}%`));
  if (filters.groupType) {
    if (Array.isArray(filters.groupType)) {
      conditions.push(inArray(phaseGroups.groupType, filters.groupType));
    } else {
      conditions.push(eq(phaseGroups.groupType, filters.groupType));
    }
  }
  if (filters.isCompleted !== undefined) {
    conditions.push(eq(phaseGroups.isCompleted, filters.isCompleted));
  }
  if (filters.isLocked !== undefined) {
    conditions.push(eq(phaseGroups.isLocked, filters.isLocked));
  }

  if (filters.orderMin !== undefined) {
    conditions.push(gte(phaseGroups.order, filters.orderMin));
  }
  if (filters.orderMax !== undefined) {
    conditions.push(lte(phaseGroups.order, filters.orderMax));
  }
  if (filters.participantCountMin !== undefined) {
    conditions.push(
      gte(phaseGroups.participantCount, filters.participantCountMin)
    );
  }
  if (filters.participantCountMax !== undefined) {
    conditions.push(
      lte(phaseGroups.participantCount, filters.participantCountMax)
    );
  }
  if (filters.matchCountMin !== undefined) {
    conditions.push(gte(phaseGroups.matchCount, filters.matchCountMin));
  }
  if (filters.matchCountMax !== undefined) {
    conditions.push(lte(phaseGroups.matchCount, filters.matchCountMax));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les participants de groupe de phase
 */
function buildPhaseGroupParticipantWhereConditions(
  filters: PhaseGroupParticipantFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  if (filters.id) conditions.push(eq(phaseGroupParticipants.id, filters.id));
  if (filters.groupId)
    conditions.push(eq(phaseGroupParticipants.groupId, filters.groupId));
  if (filters.registrationId)
    conditions.push(
      eq(phaseGroupParticipants.registrationId, filters.registrationId)
    );
  if (filters.isSeeded !== undefined) {
    conditions.push(eq(phaseGroupParticipants.isSeeded, filters.isSeeded));
  }
  if (filters.qualified !== undefined) {
    conditions.push(eq(phaseGroupParticipants.qualified, filters.qualified));
  }

  if (filters.matchesPlayedMin !== undefined) {
    conditions.push(
      gte(phaseGroupParticipants.matchesPlayed, filters.matchesPlayedMin)
    );
  }
  if (filters.matchesPlayedMax !== undefined) {
    conditions.push(
      lte(phaseGroupParticipants.matchesPlayed, filters.matchesPlayedMax)
    );
  }
  if (filters.matchesWonMin !== undefined) {
    conditions.push(
      gte(phaseGroupParticipants.matchesWon, filters.matchesWonMin)
    );
  }
  if (filters.matchesWonMax !== undefined) {
    conditions.push(
      lte(phaseGroupParticipants.matchesWon, filters.matchesWonMax)
    );
  }
  if (filters.pointsMin !== undefined) {
    conditions.push(gte(phaseGroupParticipants.points, filters.pointsMin));
  }
  if (filters.pointsMax !== undefined) {
    conditions.push(lte(phaseGroupParticipants.points, filters.pointsMax));
  }
  if (filters.positionMin !== undefined) {
    conditions.push(gte(phaseGroupParticipants.position, filters.positionMin));
  }
  if (filters.positionMax !== undefined) {
    conditions.push(lte(phaseGroupParticipants.position, filters.positionMax));
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

  if (filters.id) conditions.push(eq(bracketNodes.id, filters.id));
  if (filters.phaseId)
    conditions.push(eq(bracketNodes.phaseId, filters.phaseId));
  if (filters.groupId)
    conditions.push(eq(bracketNodes.groupId, filters.groupId));
  if (filters.nodeType) {
    if (Array.isArray(filters.nodeType)) {
      conditions.push(inArray(bracketNodes.nodeType, filters.nodeType));
    } else {
      conditions.push(eq(bracketNodes.nodeType, filters.nodeType));
    }
  }
  if (filters.nodeCode)
    conditions.push(eq(bracketNodes.nodeCode, filters.nodeCode));
  if (filters.bracketType) {
    if (Array.isArray(filters.bracketType)) {
      conditions.push(inArray(bracketNodes.bracketType, filters.bracketType));
    } else {
      conditions.push(eq(bracketNodes.bracketType, filters.bracketType));
    }
  }
  if (filters.parentNodeId)
    conditions.push(eq(bracketNodes.parentNodeId, filters.parentNodeId));
  if (filters.childPosition) {
    if (Array.isArray(filters.childPosition)) {
      conditions.push(
        inArray(bracketNodes.childPosition, filters.childPosition)
      );
    } else {
      conditions.push(eq(bracketNodes.childPosition, filters.childPosition));
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
 * Construit les conditions WHERE pour les matches
 */
function buildMatchWhereConditions(
  filters: MatchFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  if (!options.includeDeleted) {
    conditions.push(eq(matches.isDeleted, false));
  }

  if (filters.id) conditions.push(eq(matches.id, filters.id));
  if (filters.editionId)
    conditions.push(eq(matches.editionId, filters.editionId));
  if (filters.phaseId) conditions.push(eq(matches.phaseId, filters.phaseId));
  if (filters.groupId) conditions.push(eq(matches.groupId, filters.groupId));
  if (filters.bracketNodeId)
    conditions.push(eq(matches.bracketNodeId, filters.bracketNodeId));
  if (filters.matchCode)
    conditions.push(eq(matches.matchCode, filters.matchCode));
  if (filters.participant1RegistrationId)
    conditions.push(
      eq(matches.participant1RegistrationId, filters.participant1RegistrationId)
    );
  if (filters.participant2RegistrationId)
    conditions.push(
      eq(matches.participant2RegistrationId, filters.participant2RegistrationId)
    );
  if (filters.winnerRegistrationId)
    conditions.push(
      eq(matches.winnerRegistrationId, filters.winnerRegistrationId)
    );
  if (filters.submittedByUserId)
    conditions.push(eq(matches.submittedByUserId, filters.submittedByUserId));
  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(inArray(matches.status, filters.statuses));
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

  if (filters.scheduledTimeFrom) {
    conditions.push(
      gte(matches.scheduledTime, new Date(filters.scheduledTimeFrom))
    );
  }
  if (filters.scheduledTimeTo) {
    conditions.push(
      lte(matches.scheduledTime, new Date(filters.scheduledTimeTo))
    );
  }
  if (filters.createdFrom) {
    conditions.push(gte(matches.createdAt, new Date(filters.createdFrom)));
  }
  if (filters.createdTo) {
    conditions.push(lte(matches.createdAt, new Date(filters.createdTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les inscriptions à une édition
 */
function buildEditionRegistrationWhereConditions(
  filters: EditionRegistrationFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  if (!options.includeDeleted) {
    conditions.push(eq(editionRegistrations.isDeleted, false));
  }

  if (filters.id) conditions.push(eq(editionRegistrations.id, filters.id));
  if (filters.editionId)
    conditions.push(eq(editionRegistrations.editionId, filters.editionId));
  if (filters.memberId)
    conditions.push(eq(editionRegistrations.memberId, filters.memberId));
  if (filters.registrationType) {
    if (Array.isArray(filters.registrationType)) {
      conditions.push(
        inArray(editionRegistrations.registrationType, filters.registrationType)
      );
    } else {
      conditions.push(
        eq(editionRegistrations.registrationType, filters.registrationType)
      );
    }
  }
  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(inArray(editionRegistrations.status, filters.statuses));
  }
  if (filters.gameLevel)
    conditions.push(eq(editionRegistrations.gameLevel, filters.gameLevel));
  if (filters.gameRank)
    conditions.push(eq(editionRegistrations.gameRank, filters.gameRank));
  if (filters.gameRegion)
    conditions.push(eq(editionRegistrations.gameRegion, filters.gameRegion));
  if (filters.checkedIn !== undefined) {
    conditions.push(eq(editionRegistrations.checkedIn, filters.checkedIn));
  }
  if (filters.feePaid !== undefined) {
    conditions.push(eq(editionRegistrations.feePaid, filters.feePaid));
  }
  if (filters.feeWaived !== undefined) {
    conditions.push(eq(editionRegistrations.feeWaived, filters.feeWaived));
  }
  if (filters.qualifiedFromPrevious !== undefined) {
    conditions.push(
      eq(
        editionRegistrations.qualifiedFromPrevious,
        filters.qualifiedFromPrevious
      )
    );
  }

  if (filters.registrationFeeMin !== undefined) {
    conditions.push(
      gte(
        editionRegistrations.registrationFee,
        String(filters.registrationFeeMin)
      )
    );
  }
  if (filters.registrationFeeMax !== undefined) {
    conditions.push(
      lte(
        editionRegistrations.registrationFee,
        String(filters.registrationFeeMax)
      )
    );
  }

  if (filters.registeredFrom) {
    conditions.push(
      gte(editionRegistrations.registeredAt, new Date(filters.registeredFrom))
    );
  }
  if (filters.registeredTo) {
    conditions.push(
      lte(editionRegistrations.registeredAt, new Date(filters.registeredTo))
    );
  }
  if (filters.checkedInFrom) {
    conditions.push(
      gte(editionRegistrations.checkedInAt, new Date(filters.checkedInFrom))
    );
  }
  if (filters.checkedInTo) {
    conditions.push(
      lte(editionRegistrations.checkedInAt, new Date(filters.checkedInTo))
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les paiements d'inscription
 */
function buildRegistrationPaymentWhereConditions(
  filters: RegistrationPaymentFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  if (filters.id) conditions.push(eq(registrationPayments.id, filters.id));
  if (filters.registrationId)
    conditions.push(
      eq(registrationPayments.registrationId, filters.registrationId)
    );
  if (filters.transactionId)
    conditions.push(
      eq(registrationPayments.transactionId, filters.transactionId)
    );
  if (filters.paymentMethod) {
    if (Array.isArray(filters.paymentMethod)) {
      conditions.push(
        inArray(registrationPayments.paymentMethod, filters.paymentMethod)
      );
    } else {
      conditions.push(
        eq(registrationPayments.paymentMethod, filters.paymentMethod)
      );
    }
  }
  if (filters.paymentProvider) {
    if (Array.isArray(filters.paymentProvider)) {
      conditions.push(
        inArray(registrationPayments.paymentProvider, filters.paymentProvider)
      );
    } else {
      conditions.push(
        eq(registrationPayments.paymentProvider, filters.paymentProvider)
      );
    }
  }
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      conditions.push(inArray(registrationPayments.status, filters.status));
    } else {
      conditions.push(eq(registrationPayments.status, filters.status));
    }
  }

  if (filters.amountMin !== undefined) {
    conditions.push(
      gte(registrationPayments.amount, String(filters.amountMin))
    );
  }
  if (filters.amountMax !== undefined) {
    conditions.push(
      lte(registrationPayments.amount, String(filters.amountMax))
    );
  }

  if (filters.paidFrom) {
    conditions.push(
      gte(registrationPayments.paidAt, new Date(filters.paidFrom))
    );
  }
  if (filters.paidTo) {
    conditions.push(lte(registrationPayments.paidAt, new Date(filters.paidTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les résultats d'édition
 */
function buildEditionResultWhereConditions(
  filters: EditionResultFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  if (filters.id) conditions.push(eq(editionResults.id, filters.id));
  if (filters.editionId) {
    if (Array.isArray(filters.editionId)) {
      conditions.push(inArray(editionResults.editionId, filters.editionId));
    } else {
      conditions.push(eq(editionResults.editionId, filters.editionId));
    }
  }
  if (filters.registrationId)
    conditions.push(eq(editionResults.registrationId, filters.registrationId));
  if (filters.tier) {
    if (Array.isArray(filters.tier)) {
      conditions.push(inArray(editionResults.tier, filters.tier));
    } else {
      conditions.push(eq(editionResults.tier, filters.tier));
    }
  }
  if (filters.prizePaid !== undefined) {
    conditions.push(eq(editionResults.prizePaid, filters.prizePaid));
  }

  if (filters.positionMin !== undefined) {
    conditions.push(gte(editionResults.position, filters.positionMin));
  }
  if (filters.positionMax !== undefined) {
    conditions.push(lte(editionResults.position, filters.positionMax));
  }
  if (filters.prizeAmountMin !== undefined) {
    conditions.push(
      gte(editionResults.prizeAmount, String(filters.prizeAmountMin))
    );
  }
  if (filters.prizeAmountMax !== undefined) {
    conditions.push(
      lte(editionResults.prizeAmount, String(filters.prizeAmountMax))
    );
  }
  if (filters.matchesPlayedMin !== undefined) {
    conditions.push(
      gte(editionResults.matchesPlayed, filters.matchesPlayedMin)
    );
  }
  if (filters.matchesPlayedMax !== undefined) {
    conditions.push(
      lte(editionResults.matchesPlayed, filters.matchesPlayedMax)
    );
  }
  if (filters.matchesWonMin !== undefined) {
    conditions.push(gte(editionResults.matchesWon, filters.matchesWonMin));
  }
  if (filters.matchesWonMax !== undefined) {
    conditions.push(lte(editionResults.matchesWon, filters.matchesWonMax));
  }

  if (filters.paidFrom) {
    conditions.push(gte(editionResults.paidAt, new Date(filters.paidFrom)));
  }
  if (filters.paidTo) {
    conditions.push(lte(editionResults.paidAt, new Date(filters.paidTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
