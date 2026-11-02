"use server";

import { getCurrentUser } from "@/lib/auth/session";
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
  type TournamentWithRelations,
  type TournamentEditionWithRelations,
} from "@/database/schema";

import {
  eq,
  and,
  or,
  like,
  ilike,
  inArray,
  notInArray,
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
import { revalidatePath, revalidateTag, cacheTag, cacheLife } from "next/cache";
import { createNotification } from "@/actions/notifications";
import {
  type TournamentCard,
  type TournamentStats,
  TOURNAMENT_CARD_COLUMNS,
  USER_MINI_COLUMNS,
  EDITION_SUMMARY_COLUMNS,
  PAGINATION_DEFAULTS,
} from "@/types/view-models";

import { buildTournamentWhereConditions } from "./helpers";

export async function getTournamentsWithEditions(
  limit: number = PAGINATION_DEFAULTS.FEED,
  sortBy: keyof Tournament = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
): Promise<Tournament[]> {
  "use cache";
  cacheTag("tournaments");
  cacheLife("minutes");
  try {
    const order = sortOrder === "desc" ? desc : asc;
    const result = await db.query.tournaments.findMany({
      limit,
      orderBy: order(tournaments[sortBy]),
      with: {
        editions: {
          columns: EDITION_SUMMARY_COLUMNS,
        },
      },
    });
    return result;
  } catch (error) {
    console.error("Error getting tournaments with editions:", error);
    throw new Error("Failed to fetch tournaments with editions");
  }
}
/**
 * Récupère un tournoi par son ID avec relations optionnelles
 */
export async function getTournamentById(
  idOrSlug: string,
  options?: { populate?: string[] },
): Promise<TournamentWithRelations | null> {
  "use cache";
  cacheTag(`tournament-${idOrSlug}`, "tournaments");
  cacheLife("minutes");
  try {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    if (options?.populate && options.populate.length > 0) {
      const query = db.query.tournaments.findFirst({
        where: (tournaments, { eq, or }) =>
          or(eq(tournaments.id, idOrSlug), eq(tournaments.slug, idOrSlug)),
        with: {
          organizer: options.populate.includes("organizer")
            ? { columns: USER_MINI_COLUMNS }
            : undefined,
          members: options.populate.includes("members") ? true : undefined,
          editions: options.populate.includes("editions")
            ? {
                columns: EDITION_SUMMARY_COLUMNS,
              }
            : undefined,
          theme: options.populate.includes("theme") ? {} : undefined,
        },
      });
      const result = await query;
      if (!result) return null;
      const { theme, ...rest } = result;
      return {
        ...rest,
        theme: options.populate.includes("theme")
          ? (theme ?? undefined)
          : undefined,
      } as TournamentWithRelations;
    }

    const result = await db
      .select()
      .from(tournaments)
      .where(or(eq(tournaments.id, idOrSlug), eq(tournaments.slug, idOrSlug)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error getting tournament by ID or Slug:", error);
    throw new Error("Failed to fetch tournament");
  }
}

/**
 * Récupère une édition par son ID avec relations optionnelles
 */
export async function getTournaments(
  query: ListQuery<TournamentFilters> = {},
): Promise<PaginationResponse<Tournament>> {
  "use cache";
  cacheTag("tournaments");
  cacheLife("minutes");
  try {
    const {
      pagination = { page: 1, limit: PAGINATION_DEFAULTS.FEED },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = await buildTournamentWhereConditions(
      filters,
      options,
    );

    const [tournamentsData, totalResult] = await Promise.all([
      db.query.tournaments.findMany({
        columns: TOURNAMENT_CARD_COLUMNS,
        where: whereConditions,
        limit: pagination.limit,
        offset: offset,
        orderBy: (tournaments, { desc, asc }) => {
          if (options.sortBy) {
            const sortField = options.sortBy as any;
            return [
              options.sortOrder === "desc"
                ? desc((tournaments as any)[sortField])
                : asc((tournaments as any)[sortField]),
            ];
          }
          return [desc(tournaments.createdAt)];
        },
      }),
      db.select({ count: count() }).from(tournaments).where(whereConditions),
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: tournamentsData as Tournament[],
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
 * Vérifie si un utilisateur est organisateur ou co-organisateur d'un tournoi
 */
export async function isUserTournamentOrganizer(
  tournamentId: string,
  userId: string,
): Promise<boolean> {
  try {
    const tournament = await db.query.tournaments.findFirst({
      where: (tournaments, { eq, or }) =>
        or(
          eq(tournaments.id, tournamentId),
          eq(tournaments.slug, tournamentId),
        ),
      columns: { id: true, organizerId: true },
    });

    if (!tournament) return false;
    if (tournament.organizerId === userId) return true;

    // 2. Vérifier si c'est un co-organisateur dans les membres
    const member = await db.query.tournamentMembers.findFirst({
      where: (tournamentMembers, { and, eq, or }) =>
        and(
          eq(tournamentMembers.tournamentId, tournament.id),
          eq(tournamentMembers.userId, userId),
          or(
            eq(tournamentMembers.role, "ORGANIZER"),
            eq(tournamentMembers.role, "CO_ORGANIZER"),
            eq(tournamentMembers.isCoOrganizer, true),
          ),
        ),
    });

    return !!member;
  } catch (error) {
    console.error("Error checking tournament organizer status:", error);
    return false;
  }
}

/**
 * Met à jour le rôle d'un membre du tournoi
 * SEC-07 FIX: Tournament organizer or admin only
 */
export async function getTournamentStats(
  filters?: TournamentFilters,
): Promise<TournamentStats> {
  "use cache";
  cacheTag("tournaments", "stats");
  cacheLife("minutes");
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
          and(await whereConditions, eq(tournaments.visibility, "PRIVATE")),
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
export async function createTournament(
  tournamentData: NewTournament,
): Promise<Tournament> {
  try {
    // SEC-07 FIX: organizerId is always sourced from the authenticated session
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Non authentifié');

    if (
      !tournamentData.name ||
      !tournamentData.game
    ) {
      throw new Error("name and game are required");
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
        organizerId: currentUser.id, // Always use the authenticated user's ID
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidateTag("tournaments", "max");
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
export async function updateTournament(
  id: string,
  tournamentData: Partial<NewTournament>,
): Promise<Tournament> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Non authentifié");
    const isAdmin = currentUser.role === "admin" || (currentUser as any).isAdmin === true;

    const existingTournament = await getTournamentById(id);
    if (!existingTournament) {
      throw new Error("Tournament not found");
    }

    if (!isAdmin) {
      const isOrganizer = await isUserTournamentOrganizer(id, currentUser.id);
      if (!isOrganizer) {
        throw new Error("Accès refusé — vous n'êtes pas organisateur de ce tournoi");
      }
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

    const safeData = { ...tournamentData };
    if (!isAdmin) {
      delete (safeData as any).organizerId;
      delete (safeData as any).isFeatured;
      delete (safeData as any).isVerified;
    }

    const result = await db
      .update(tournaments)
      .set({
        ...safeData,
        updatedAt: new Date(),
      })
      .where(eq(tournaments.id, id))
      .returning();

    revalidateTag("tournaments", "max");
    revalidateTag(`tournament-${id}`, "max");
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
 * SEC-07 FIX: Organizer or admin only
 */
export async function deleteTournament(id: string): Promise<Tournament> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Non authentifié");
    const isAdmin = currentUser.role === "admin" || (currentUser as any).isAdmin === true;

    const existing = await getTournamentById(id);
    if (!existing) throw new Error("Tournament not found");

    if (!isAdmin) {
      const isOrganizer = await isUserTournamentOrganizer(id, currentUser.id);
      if (!isOrganizer) throw new Error("Accès refusé — vous n'êtes pas organisateur de ce tournoi");
    }

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
    revalidateTag("tournaments", "max");
    revalidateTag(`tournament-${id}`, "max");
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
 * SEC-07 FIX: Organizer or admin only
 */
export async function restoreTournament(id: string): Promise<Tournament> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Non authentifié");
    const isAdmin = currentUser.role === "admin" || (currentUser as any).isAdmin === true;
    if (!isAdmin) throw new Error("Accès réservé aux administrateurs");

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
 * SEC-07 FIX: Admin only
 */