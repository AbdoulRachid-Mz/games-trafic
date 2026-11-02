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

import {
  buildTournamentMemberWhereConditions,
  buildEditionRegistrationWhereConditions,
  buildRegistrationPaymentWhereConditions,
} from "./helpers";
import { isUserTournamentOrganizer } from "./tournaments";

export async function updateTournamentMemberRole(
  memberId: string,
  role: string,
  isCoOrganizer: boolean,
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Non authentifié");
    const isAdmin = currentUser.role === "admin" || (currentUser as any).isAdmin === true;

    const member = await db.query.tournamentMembers.findFirst({
      where: (tm, { eq }) => eq(tm.id, memberId),
    });
    if (!member) throw new Error("Membre non trouvé");

    if (!isAdmin) {
      const isOrganizer = await isUserTournamentOrganizer(member.tournamentId, currentUser.id);
      if (!isOrganizer) throw new Error("Accès refusé — vous n'êtes pas organisateur de ce tournoi");
    }

    const result = await db
      .update(tournamentMembers)
      .set({
        role,
        isCoOrganizer,
        updatedAt: new Date(),
      })
      .where(eq(tournamentMembers.id, memberId))
      .returning();

    if (result[0]?.tournamentId) {
      revalidatePath(
        `/tournaments/${result[0].tournamentId}/dashboard/members`,
      );
      revalidatePath(`/tournaments/${result[0].tournamentId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating member role:", error);
    throw new Error("Erreur lors de la mise à jour du rôle");
  }
}

/**
 * Supprime un membre du tournoi
 * SEC-07 FIX: Organizer, admin, or the member themself (leave)
 */
export async function deleteTournamentMember(memberId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Non authentifié");
    const isAdmin = currentUser.role === "admin" || (currentUser as any).isAdmin === true;

    const member = await db.query.tournamentMembers.findFirst({
      where: (tm, { eq }) => eq(tm.id, memberId),
    });
    if (!member) throw new Error("Membre non trouvé");

    if (!isAdmin && member.userId !== currentUser.id) {
      const isOrganizer = await isUserTournamentOrganizer(member.tournamentId, currentUser.id);
      if (!isOrganizer) throw new Error("Accès refusé");
    }

    await db
      .delete(tournamentMembers)
      .where(eq(tournamentMembers.id, memberId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting member:", error);
    throw new Error("Failed to delete tournament member");
  }
}
/**
 * Liste les éditions avec pagination, filtres et options
 */
export async function addTournamentMember(
  memberData: NewTournamentMember,
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
        eq(tournamentMembers.contactEmail, memberData.contactEmail),
      );
    }

    // Check by Contact Phone if provided
    if (memberData.contactPhone) {
      conditions.push(
        eq(tournamentMembers.contactPhone, memberData.contactPhone),
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
            or(...conditions),
          ),
        )
        .limit(1);

      if (existingMember.length > 0) {
        // We can be specific about why it failed if we want, but a generic message is safer
        throw new Error(
          "Member already exists in this tournament (same User, Email, or Phone)",
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
      "Failed to add tournament member: " + (error.message || "Unknown error"),
    );
  }
}

/**
 * Met à jour un membre de tournoi
 */
export async function updateTournamentMember(
  id: string,
  memberData: Partial<NewTournamentMember>,
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

    if (result[0]?.tournamentId) {
      // Import can just be at top but we already have it in the file now
      try {
        const { revalidatePath } = require("next/cache");
        revalidatePath(
          `/tournaments/${result[0].tournamentId}/dashboard/members`,
        );
        revalidatePath(`/tournaments/${result[0].tournamentId}`);
      } catch (e) {
        console.error("Revalidation failed", e);
      }
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

// ============================================================================
// TOURNAMENT PHASES
// ============================================================================

/**
 * Crée une phase de tournoi
 */
export async function getRegistrationWithMember(
  registrationId: string,
): Promise<any> {
  try {
    const registration = await db.query.editionRegistrations.findFirst({
      where: eq(editionRegistrations.id, registrationId),
      with: {
        member: {
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                fullName: true,
                profileImage: true,
              },
            },
            team: {
              columns: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
        edition: true,
      },
    });

    return registration;
  } catch (error) {
    console.error("Error getting registration with member:", error);
    return null;
  }
}

/**
 * Validation finale par l'administrateur ou l'organisateur.
 * SEC-07 FIX: Admin or tournament organizer only
 */
export async function createEditionRegistration(
  registrationData: NewEditionRegistration,
): Promise<EditionRegistration> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Non authentifié");
    const isAdmin = currentUser.role === "admin" || (currentUser as any).isAdmin === true;

    if (!registrationData.editionId || !registrationData.memberId) {
      throw new Error("editionId and memberId are required");
    }

    if (!isAdmin) {
      const edition = await db.query.tournamentEditions.findFirst({
        where: eq(tournamentEditions.id, registrationData.editionId),
        columns: { tournamentId: true },
      });
      if (!edition) throw new Error("Édition non trouvée");

      const isOrganizer = await isUserTournamentOrganizer(edition.tournamentId, currentUser.id);
      if (!isOrganizer) {
        const member = await db.query.tournamentMembers.findFirst({
          where: eq(tournamentMembers.id, registrationData.memberId),
          columns: { userId: true },
        });
        if (!member || member.userId !== currentUser.id) {
          throw new Error("Accès refusé — vous ne pouvez inscrire que vous-même");
        }
      }
    }

    const existingRegistration = await db
      .select()
      .from(editionRegistrations)
      .where(
        and(
          eq(editionRegistrations.editionId, registrationData.editionId),
          eq(editionRegistrations.memberId, registrationData.memberId),
        ),
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
  registrationData: Partial<NewEditionRegistration>,
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

    revalidatePath(
      `/tournaments/[tournamentId]/editions/[editionId]/dashboard/participants`,
      "page",
    );
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
  query: ListQuery<EditionRegistrationFilters> = {},
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
      options,
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
                      "payment.transaction",
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
                  ],
                ),
              ]
            : [
                asc(
                  editionRegistrations[
                    options.sortBy as keyof EditionRegistration
                  ],
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

/**
 * Récupère les membres d'un tournoi qui ne sont PAS inscrits à l'édition donnée.
 */
export async function getTournamentMembersNotInEdition(
  tournamentId: string,
  editionId: string,
  query: ListQuery<{}> = {},
) {
  try {
    const { pagination = { page: 1, limit: 50 }, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    // Fetch members of the tournament
    const membersQuery = db
      .select({
        member: tournamentMembers,
        user: users,
        team: teams,
      })
      .from(tournamentMembers)
      .leftJoin(users, eq(tournamentMembers.userId, users.id))
      .leftJoin(teams, eq(tournamentMembers.teamId, teams.id))
      .where(eq(tournamentMembers.tournamentId, tournamentId));

    // Fetch existing registrations for the edition
    const registrationsQuery = db
      .select({ memberId: editionRegistrations.memberId })
      .from(editionRegistrations)
      .where(eq(editionRegistrations.editionId, editionId));

    const [membersData, registrationsData] = await Promise.all([
      membersQuery,
      registrationsQuery,
    ]);

    const registeredMemberIds = new Set(
      registrationsData.map((r) => r.memberId),
    );

    // Filter members not registered
    const unregisteredMembers = membersData.filter(
      (m) => !registeredMemberIds.has(m.member.id),
    );

    // Manual Pagination (since we filtered in memory)
    const total = unregisteredMembers.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const paginatedMembers = unregisteredMembers.slice(
      offset,
      offset + pagination.limit,
    );

    return {
      data: paginatedMembers,
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
    console.error("Error getting unregistered members:", error);
    throw new Error("Failed to fetch unregistered members");
  }
}

// ============================================================================
// REGISTRATION PAYMENTS
// ============================================================================

/**
 * Crée un paiement d'inscription
 */
export async function createRegistrationPayment(
  paymentData: NewRegistrationPayment,
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
  paymentData: Partial<NewRegistrationPayment>,
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
  query: ListQuery<RegistrationPaymentFilters> = {},
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
      options,
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
                  ],
                ),
              ]
            : [
                asc(
                  registrationPayments[
                    options.sortBy as keyof RegistrationPayment
                  ],
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