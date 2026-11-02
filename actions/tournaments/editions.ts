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

import { buildTournamentEditionWhereConditions } from "./helpers";
import { isUserTournamentOrganizer } from "./tournaments";

export async function getTournamentEditionById(
  id: string,
  options?: { populate?: string[] },
): Promise<TournamentEditionWithRelations | null> {
  "use cache";
  cacheTag(`tournament-edition-${id}`, "tournaments");
  cacheLife("minutes");
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
export async function getTournamentEditions(
  query: ListQuery<TournamentEditionFilters> = {},
): Promise<PaginationResponse<TournamentEdition>> {
  "use cache";
  cacheTag("tournaments");
  cacheLife("minutes");
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildTournamentEditionWhereConditions(
      filters,
      options,
    );

    const editionsQuery = db.query.tournamentEditions.findMany({
      where: whereConditions,
      limit: pagination.limit,
      offset: offset,
      orderBy: (editions, { desc: _desc, asc: _asc }) => {
        const order = options.sortOrder === "desc" ? _desc : _asc;
        const sortableColumns: Record<string, any> = {
          createdAt: editions.createdAt,
          updatedAt: editions.updatedAt,
          startDate: editions.startDate,
          endDate: editions.endDate,
          name: editions.name,
          status: editions.status,
          currentParticipants: editions.currentParticipants,
          maxParticipants: editions.maxParticipants,
        };
        const col =
          options.sortBy && sortableColumns[options.sortBy]
            ? sortableColumns[options.sortBy]
            : editions.createdAt;
        return [order(col)];
      },
      with: {
        tournament: {
          columns: TOURNAMENT_CARD_COLUMNS,
        },
      } as any,
    });

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
      data: editionsData as any,
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
export async function getEditionDetailTree(
  editionId: string,
  filters: {
    phases?: TournamentPhaseFilters;
    groups?: PhaseGroupFilters;
    bracketNodes?: BracketNodeFilters;
    matches?: MatchFilters;
  } = {},
  options: QueryOptions = {},
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
      if (options.includeInactive !== true && p.isActive === false)
        return false;
      if (
        f.phaseType &&
        Array.isArray(f.phaseType) &&
        !f.phaseType.includes(p.phaseType)
      )
        return false;
      if (f.isCompleted !== undefined && p.isCompleted !== f.isCompleted)
        return false;
      if (f.isHidden !== undefined && p.isHidden !== f.isHidden) return false;
      if (f.orderMin !== undefined && p.order < f.orderMin) return false;
      if (f.orderMax !== undefined && p.order > f.orderMax) return false;
      return true;
    };

    const filterGroup = (g: any) => {
      const f = filters.groups || {};
      if (options.includeDeleted !== true && g.isDeleted) return false;
      if (
        f.groupType &&
        Array.isArray(f.groupType) &&
        !f.groupType.includes(g.groupType)
      )
        return false;
      if (f.isCompleted !== undefined && g.isCompleted !== f.isCompleted)
        return false;
      if (f.isLocked !== undefined && g.isLocked !== f.isLocked) return false;
      if (f.orderMin !== undefined && g.order < f.orderMin) return false;
      if (f.orderMax !== undefined && g.order > f.orderMax) return false;
      return true;
    };

    const filterNode = (n: any) => {
      const f = filters.bracketNodes || {};
      if (options.includeDeleted !== true && n.isDeleted) return false;
      if (
        f.bracketType &&
        Array.isArray(f.bracketType) &&
        !f.bracketType.includes(n.bracketType)
      )
        return false;
      if (f.roundMin !== undefined && (n.round ?? 0) < f.roundMin) return false;
      if (f.roundMax !== undefined && (n.round ?? 0) > f.roundMax) return false;
      if (
        f.matchNumberMin !== undefined &&
        (n.matchNumber ?? 0) < f.matchNumberMin
      )
        return false;
      if (
        f.matchNumberMax !== undefined &&
        (n.matchNumber ?? 0) > f.matchNumberMax
      )
        return false;
      if (f.depthMin !== undefined && (n.depth ?? 0) < f.depthMin) return false;
      if (f.depthMax !== undefined && (n.depth ?? 0) > f.depthMax) return false;
      return true;
    };

    const filterMatch = (m: any) => {
      const f = filters.matches || {};
      if (options.includeDeleted !== true && m.isDeleted) return false;
      if (
        f.statuses &&
        Array.isArray(f.statuses) &&
        !f.statuses.includes(m.status)
      )
        return false;
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
export async function createTournamentEdition(
  editionData: NewTournamentEdition,
): Promise<TournamentEdition> {
  try {
    // SEC-07 FIX: Require auth + tournament ownership or admin
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Non authentifié');
    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;

    if (
      !editionData.tournamentId ||
      !editionData.editionNumber ||
      !editionData.startDate
    ) {
      throw new Error("tournamentId, editionNumber and startDate are required");
    }

    // Only the organizer or an admin can create editions
    if (!isAdmin) {
      const isOrganizer = await isUserTournamentOrganizer(editionData.tournamentId, currentUser.id);
      if (!isOrganizer) throw new Error('Accès refusé — vous n\'êtes pas organisateur de ce tournoi');
    }

    const result = await db.transaction(async (tx) => {
      // 1. Create Financial Account for Edition (Prize Pool)
      const [account] = await tx
        .insert(financialAccounts)
        .values({
          ownerEditionId: undefined, // Will link after edition is created
          type: "TOURNAMENT_POOL",
          currency: editionData.prizeCurrency || "GTC",
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

    // Notifier les followers du tournoi
    try {
      const followers = await db
        .select({ userId: interactions.userId })
        .from(interactions)
        .where(
          and(
            eq(interactions.entityId, editionData.tournamentId),
            eq(interactions.entityType, "TOURNAMENT"),
            eq(interactions.type, "FOLLOW"),
            eq(interactions.isDeleted, false),
          ),
        );

      if (followers.length > 0) {
        const tournament = await db.query.tournaments.findFirst({
          where: (tournaments, { eq }) =>
            eq(tournaments.id, editionData.tournamentId),
          columns: { name: true },
        });

        const tournamentName = tournament?.name || "Un tournoi que vous suivez";

        await Promise.all(
          followers.map((follower) =>
            createNotification({
              userId: follower.userId,
              title: "Nouvelle édition !",
              message: `${tournamentName} a lancé une nouvelle édition : ${editionData.name || `Édition #${editionData.editionNumber}`}`,
              type: "SYSTEM",
              linkUrl: `/tournaments/${editionData.tournamentId}/editions/${result.id}`,
              tournamentId: editionData.tournamentId,
            }),
          ),
        );
      }
    } catch (notifError) {
      console.error("Error sending notifications to followers:", notifError);
    }

    return result;
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
 * SEC-07 FIX: Organizer or admin only
 */
export async function updateTournamentEdition(
  id: string,
  editionData: Partial<NewTournamentEdition>,
): Promise<TournamentEdition> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Non authentifié");
    const isAdmin = currentUser.role === "admin" || (currentUser as any).isAdmin === true;

    const existingEdition = await getTournamentEditionById(id);
    if (!existingEdition) {
      throw new Error("Tournament edition not found");
    }

    if (!isAdmin) {
      const isOrganizer = await isUserTournamentOrganizer(existingEdition.tournamentId, currentUser.id);
      if (!isOrganizer) {
        throw new Error("Accès refusé — vous n'êtes pas organisateur de ce tournoi");
      }
    }

    const safeData = { ...editionData };
    if (!isAdmin) {
      delete (safeData as any).tournamentId;
      delete (safeData as any).financialAccountId;
    }

    const result = await db
      .update(tournamentEditions)
      .set({
        ...safeData,
        updatedAt: new Date(),
      })
      .where(eq(tournamentEditions.id, id))
      .returning();

    revalidateTag("tournaments", "max");
    revalidateTag(`tournament-edition-${id}`, "max");
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
 * SEC-07 FIX: Organizer or admin only
 */
export async function deleteTournamentEdition(
  id: string,
): Promise<TournamentEdition> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Non authentifié");
    const isAdmin = currentUser.role === "admin" || (currentUser as any).isAdmin === true;

    const existing = await getTournamentEditionById(id);
    if (!existing) throw new Error("Tournament edition not found");

    if (!isAdmin) {
      const isOrganizer = await isUserTournamentOrganizer(existing.tournamentId, currentUser.id);
      if (!isOrganizer) throw new Error("Accès refusé — vous n'êtes pas organisateur de ce tournoi");
    }

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
    revalidateTag("tournaments", "max");
    revalidateTag(`tournament-edition-${id}`, "max");
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
 * SEC-07 FIX: Admin only
 */
export async function restoreTournamentEdition(
  id: string,
): Promise<TournamentEdition> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Non authentifié");
    const isAdmin = currentUser.role === "admin" || (currentUser as any).isAdmin === true;
    if (!isAdmin) throw new Error("Accès réservé aux administrateurs");

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
export async function finalizeTournamentEditionAction(
  editionId: string,
  winnerRegistrationId: string,
) {
  try {
    return await db.transaction(async (tx) => {
      // 1. Récupérer les infos du gagnant
      const winnerReg = await tx.query.editionRegistrations.findFirst({
        where: eq(editionRegistrations.id, winnerRegistrationId),
        with: {
          member: {
            with: { user: true },
          },
        },
      });

      if (!winnerReg) throw new Error("Vainqueur introuvable");

      const winnerMetadata = {
        displayName:
          winnerReg.member?.displayName ||
          winnerReg.member?.user?.username ||
          "Champion",
        avatar:
          winnerReg.member?.avatar || winnerReg.member?.user?.image || null,
        gameTag: winnerReg.member?.gameTag || null,
        clubName: winnerReg.member?.clubName || null,
        registrationId: winnerRegistrationId,
        memberId: winnerReg.memberId,
        confirmedAt: new Date().toISOString(),
      };

      // 2. Mettre à jour l'édition
      await tx
        .update(tournamentEditions)
        .set({
          status: "COMPLETED",
          endDate: new Date(),
          winnerId: winnerReg.memberId,
          winnerMetadata,
          updatedAt: new Date(),
        })
        .where(eq(tournamentEditions.id, editionId));

      // 3. Mettre à jour le résultat de l'édition (position 1)
      await tx
        .insert(editionResults)
        .values({
          editionId,
          registrationId: winnerRegistrationId,
          position: 1,
          tier: "GOLD",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [editionResults.editionId, editionResults.registrationId],
          set: { position: 1, tier: "GOLD", updatedAt: new Date() },
        });

      revalidatePath(`/tournaments/dashboard`);

      return { success: true, winner: winnerMetadata.displayName };
    });
  } catch (error: any) {
    console.error("Error finalizing edition:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// MATCHES
// ============================================================================

/**
 * Crée un match
 */