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

import { recalculateGroupStandings } from "@/actions/phases";
import { buildEditionResultWhereConditions } from "./helpers";
import { getRegistrationWithMember } from "./members";
import { isUserTournamentOrganizer } from "./tournaments";
import {
  isMatchScheduleValid,
  resolveMatchSchedule,
} from "@/lib/tournaments/scheduling";

/**
 * Ne complète la programmation que si elle est absente/invalide.
 * À appeler DANS une transaction avec la ligne match verrouillée : la
 * référence temporelle est unique et un retry ne duplique rien.
 */
async function computeMatchScheduleFields(
  tx: any,
  match: Match,
  now: Date,
): Promise<{ scheduledTime?: Date; estimatedDuration?: number }> {
  if (isMatchScheduleValid(match)) return {};

  const [phase, edition] = await Promise.all([
    tx.query.tournamentPhases.findFirst({
      where: eq(tournamentPhases.id, match.phaseId),
      columns: { matchDuration: true },
    }),
    tx.query.tournamentEditions.findFirst({
      where: eq(tournamentEditions.id, match.editionId),
      columns: { editionConfig: true },
    }),
  ]);

  const editionConfig = (edition?.editionConfig as any) || {};
  const configuredDuration =
    phase?.matchDuration ??
    editionConfig.matchDuration ??
    editionConfig.matchDurationMinutes ??
    editionConfig.estimatedDuration ??
    null;

  const schedule = resolveMatchSchedule(match, {
    configuredDuration,
    now,
  });

  return {
    scheduledTime: schedule.scheduledTime,
    estimatedDuration: schedule.estimatedDuration,
  };
}

export async function handleMatchProgression(match: Match) {
  try {
    if (!match.bracketNodeId || !match.winnerRegistrationId) return;

    // 1. Get current node to find its parent
    const currentNode = await db.query.bracketNodes.findFirst({
      where: eq(bracketNodes.id, match.bracketNodeId),
    });

    if (!currentNode?.parentNodeId) return; // Finale ou pas de suite

    // 2. Get parent node
    const parentNode = await db.query.bracketNodes.findFirst({
      where: eq(bracketNodes.id, currentNode.parentNodeId),
    });

    if (!parentNode) return;

    // 3. Find the match associated with the parent node
    const nextMatch = await db.query.matches.findFirst({
      where: eq(matches.bracketNodeId, parentNode.id),
    });

    if (!nextMatch) return;

    // 4. Determine slot in next match
    const matchUpdateData: any = {};

    // Logic: fill first empty slot
    if (!nextMatch.participant1RegistrationId) {
      matchUpdateData.participant1RegistrationId = match.winnerRegistrationId;
    } else if (!nextMatch.participant2RegistrationId) {
      matchUpdateData.participant2RegistrationId = match.winnerRegistrationId;
    } else {
      // Slot already occupied (maybe a manual correction was made)
      return;
    }

    await db
      .update(matches)
      .set(matchUpdateData)
      .where(eq(matches.id, nextMatch.id));
  } catch (error) {
    console.error("Match Progression failed:", error);
  }
}

/**
 * Met à jour les statistiques agrégées d'un participant pour toute l'édition.
 */
export async function updateEditionResultForParticipant(
  registrationId: string,
  editionId: string,
) {
  try {
    // 1. Get all completed matches for this participant in this edition
    const participantMatches = await db.query.matches.findMany({
      where: and(
        eq(matches.editionId, editionId),
        eq(matches.status, "COMPLETED"),
        or(
          eq(matches.participant1RegistrationId, registrationId),
          eq(matches.participant2RegistrationId, registrationId),
        ),
      ),
    });

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let scoreFor = 0;
    let scoreAgainst = 0;

    for (const m of participantMatches) {
      const isP1 = m.participant1RegistrationId === registrationId;
      const myScore = isP1 ? m.score1 || 0 : m.score2 || 0;
      const oppScore = isP1 ? m.score2 || 0 : m.score1 || 0;

      scoreFor += myScore;
      scoreAgainst += oppScore;

      if (m.winnerRegistrationId === registrationId) {
        wins++;
      } else if (
        m.winnerRegistrationId &&
        m.winnerRegistrationId !== registrationId
      ) {
        losses++;
      } else if (m.status === "COMPLETED" && m.score1 === m.score2) {
        draws++;
      }
    }

    // 2. UPSERT edition_results — une seule ligne par (editionId, registrationId)
    const resultData = {
      editionId,
      registrationId,
      matchesPlayed: participantMatches.length,
      matchesWon: wins,
      matchesLost: losses,
      matchesDrawn: draws,
      totalScore: scoreFor,
      updatedAt: new Date(),
      position: 0,
    };

    await db
      .insert(editionResults)
      .values({ ...resultData, createdAt: new Date() })
      .onConflictDoUpdate({
        target: [editionResults.editionId, editionResults.registrationId],
        set: {
          matchesPlayed: resultData.matchesPlayed,
          matchesWon: resultData.matchesWon,
          matchesLost: resultData.matchesLost,
          matchesDrawn: resultData.matchesDrawn,
          totalScore: resultData.totalScore,
          updatedAt: resultData.updatedAt,
        },
      });
  } catch (error) {
    console.error("Error updating edition result:", error);
  }
}

/**
 * Clôture définitivement une édition de tournoi et désigne le vainqueur.
 */
export async function submitMatchResult(
  id: string,
  score1: number,
  score2: number,
  submittedByUserId?: string,
  proofUrl?: string,
): Promise<Match> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Non authentifié");
    const isAdmin = currentUser.role === "admin" || (currentUser as any).isAdmin === true;
    const resolvedUserId = (isAdmin && submittedByUserId) ? submittedByUserId : currentUser.id;

    // pas de score negatif
    if (score1 < 0 || score2 < 0) {
      throw new Error("Le score ne peut pas être négatif");
    }

    const result = await db.transaction(async (tx) => {
      // Verrou de ligne : deux soumissions concurrentes ne peuvent pas créer
      // deux programmations différentes.
      const [match] = await tx
        .select()
        .from(matches)
        .where(eq(matches.id, id))
        .for("update");

      if (!match) throw new Error("Match not found");

      const updateData: any = {
        score1,
        score2,
        submittedByUserId: resolvedUserId,
        proofUrl,
        updatedAt: new Date(),
      };

      // Determine status and confirmations
      const isParticipant1 =
        match.participant1RegistrationId &&
        (await isUserRegistered(
          resolvedUserId,
          match.participant1RegistrationId,
        ));
      const isParticipant2 =
        match.participant2RegistrationId &&
        (await isUserRegistered(
          resolvedUserId,
          match.participant2RegistrationId,
        ));

      if (isParticipant1) {
        updateData.confirmedByParticipant1 = true;
        updateData.status = "PENDING_REVIEW";
      } else if (isParticipant2) {
        updateData.confirmedByParticipant2 = true;
        updateData.status = "PENDING_REVIEW";
      } else {
        // Admin / Organizer submission
        updateData.status = "AWAITING_ADMIN_CONFIRMATION";
      }

      // Une seule référence temporelle pour le début et la fin.
      const scheduleFields = await computeMatchScheduleFields(
        tx,
        match as Match,
        new Date(),
      );

      const updated = await tx
        .update(matches)
        .set({ ...updateData, ...scheduleFields })
        .where(eq(matches.id, id))
        .returning();

      return updated[0];
    });

    return result;
  } catch (error) {
    console.error("Error submitting match result:", error);
    throw error;
  }
}

/**
 * Confirme un résultat de match par l'autre participant.
 * SEC-07 FIX: Verified against authenticated user
 */
export async function confirmMatchResult(
  id: string,
  registrationId: string,
): Promise<Match> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Non authentifié");
    const isAdmin = currentUser.role === "admin" || (currentUser as any).isAdmin === true;

    if (!isAdmin) {
      const isOwner = await isUserRegistered(currentUser.id, registrationId);
      if (!isOwner) throw new Error("Accès refusé — vous n'êtes pas ce participant");
    }

    return await db.transaction(async (tx) => {
      const [match] = await tx
        .select()
        .from(matches)
        .where(eq(matches.id, id))
        .for("update");

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
      if (
        (updateData.confirmedByParticipant1 || match.confirmedByParticipant1) &&
        (updateData.confirmedByParticipant2 || match.confirmedByParticipant2)
      ) {
        updateData.status = "AWAITING_ADMIN_CONFIRMATION";
      }

      const scheduleFields = await computeMatchScheduleFields(
        tx,
        match as Match,
        new Date(),
      );

      const updated = await tx
        .update(matches)
        .set({ ...updateData, ...scheduleFields })
        .where(eq(matches.id, id))
        .returning();

      return updated[0];
    });
  } catch (error) {
    console.error("Error confirming match result:", error);
    throw error;
  }
}
 

/**
 * Vérifie si le gagnant a terminé tous ses matches dans le bracket actuel
 */
export async function checkIfLastMatchForWinner(
  winnerRegistrationId: string,
  bracketNodeId: string,
): Promise<boolean> {
  try {
    // Récupérer le bracket node actuel
    const currentNode = await db.query.bracketNodes.findFirst({
      where: eq(bracketNodes.id, bracketNodeId),
      with: {
        phase: true,
        group: true,
      },
    });

    if (!currentNode) return false;

    // Récupérer tous les matches du même bracket (même groupe ou même phase)
    const allMatchesInBracket = await db.query.matches.findMany({
      where: and(
        eq(matches.bracketNodeId, bracketNodeId),
        or(
          eq(matches.participant1RegistrationId, winnerRegistrationId),
          eq(matches.participant2RegistrationId, winnerRegistrationId),
        ),
        eq(matches.status, "COMPLETED"),
      ),
    });

    // Pour un bracket simple, un seul match par joueur suffit
    // Pour un bracket avec plusieurs rounds, il faut vérifier si c'est le dernier
    if (
      currentNode.phase?.phaseType === "ELIMINATION" ||
      currentNode.phase?.phaseType === "KNOCKOUT"
    ) {
      // Dans ton architecture, on vérifie s'il y a un groupe (tour) suivant
      const nextGroup = await db.query.phaseGroups.findFirst({
        where: and(
          eq(phaseGroups.phaseId, currentNode.phaseId),
          gt(phaseGroups.order, currentNode.group?.order || 0),
          eq(phaseGroups.isDeleted, false),
        ),
      });

      // S'il n'y a pas de groupe suivant, c'est le dernier match (Finale)
      if (!nextGroup) return true;

      // S'il y a un groupe suivant, ce n'est pas son dernier match dans l'édition
      return false;
    }

    // Pour une phase de groupes, vérifier si tous les matches sont joués
    if (currentNode.phase?.phaseType === "GROUP_STAGE") {
      const allMatchesInGroup = await db.query.matches.findMany({
        where: and(
          eq(matches.groupId, currentNode.groupId || ""),
          or(
            eq(matches.participant1RegistrationId, winnerRegistrationId),
            eq(matches.participant2RegistrationId, winnerRegistrationId),
          ),
        ),
      });

      const completedCount = allMatchesInGroup.filter(
        (m) => m.status === "COMPLETED",
      ).length;
      const totalCount = allMatchesInGroup.length;

      return completedCount === totalCount && totalCount > 0;
    }

    return true;
  } catch (error) {
    console.error("Error checking last match for winner:", error);
    return false;
  }
}

/**
 * Récupère la phase suivante dans l'ordre de l'édition
 */
export async function getNextPhase(
  currentPhaseId: string,
): Promise<TournamentPhase | null> {
  try {
    // Récupérer la phase actuelle
    const currentPhase = await db.query.tournamentPhases.findFirst({
      where: eq(tournamentPhases.id, currentPhaseId),
    });

    if (!currentPhase) return null;

    // Récupérer toutes les phases de l'édition
    const allPhases = await db.query.tournamentPhases.findMany({
      where: and(
        eq(tournamentPhases.editionId, currentPhase.editionId),
        eq(tournamentPhases.isDeleted, false),
      ),
      orderBy: [asc(tournamentPhases.order)],
    });

    // Trouver l'index de la phase actuelle
    const currentIndex = allPhases.findIndex((p) => p.id === currentPhaseId);

    if (currentIndex === -1 || currentIndex + 1 >= allPhases.length) {
      return null;
    }

    return allPhases[currentIndex + 1];
  } catch (error) {
    console.error("Error getting next phase:", error);
    return null;
  }
}

/**
 * Récupère une registration avec les infos du membre (user/team)
 */
export async function adminConfirmMatchResult(
  id: string,
  score1?: number,
  score2?: number,
): Promise<{
  match: Match;
  needsProgression?: boolean;
  winnerName?: string;
  winnerRegistrationId?: string;
  nextPhaseId?: string;
  progressionResult?: any;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Non authentifié");
    const isAdmin = currentUser.role === "admin" || (currentUser as any).isAdmin === true;

    const updatedMatch = await db.transaction(async (tx) => {
      const [match] = await tx
        .select()
        .from(matches)
        .where(eq(matches.id, id))
        .for("update");

      if (!match) throw new Error("Match not found");

      if (!isAdmin) {
        const edition = await tx.query.tournamentEditions.findFirst({
          where: eq(tournamentEditions.id, match.editionId),
          columns: { tournamentId: true },
        });
        if (!edition) throw new Error("Édition non trouvée");
        const isOrganizer = await isUserTournamentOrganizer(
          edition.tournamentId,
          currentUser.id,
        );
        if (!isOrganizer)
          throw new Error("Accès réservé aux organisateurs ou administrateurs");
      }

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

      // Programmation : conservée si valide, sinon complétée (une seule
      // référence temporelle ; idempotent grâce au verrou de ligne).
      const scheduleFields = await computeMatchScheduleFields(
        tx,
        match as Match,
        new Date(),
      );

      const result = await tx
        .update(matches)
        .set({
          score1: s1,
          score2: s2,
          winnerRegistrationId: winnerId,
          loserRegistrationId: loserId,
          status: "COMPLETED",
          confirmedByAdmin: true,
          ...scheduleFields,
          updatedAt: new Date(),
        })
        .where(eq(matches.id, id))
        .returning();

      return result[0];
    });

    // Trigger standings recalculation (au cas où, mais le progression-engine le fait aussi)
    if (updatedMatch.groupId) {
      await recalculateGroupStandings(updatedMatch.groupId);
    }

    // Appel au nouveau moteur central de progression
    const { progressTournamentAfterMatch } =
      await import("@/lib/tournaments/progression-engine");
    const progressionResult = await progressTournamentAfterMatch(
      updatedMatch.id,
    );

    let progressionInfo: any = { progressionResult };

    // Rétrocompatibilité avec l'ancien code du front-end
    if (
      progressionResult.isNodeComplete ||
      progressionResult.isGroupComplete ||
      progressionResult.isPhaseComplete
    ) {
      progressionInfo.needsProgression = true;

      if (progressionResult.winners && progressionResult.winners.length > 0) {
        const winnerReg = await getRegistrationWithMember(
          progressionResult.winners[0],
        );
        progressionInfo.winnerName =
          winnerReg?.member?.displayName || "Le joueur";
        progressionInfo.winnerRegistrationId = progressionResult.winners[0];
      } else if (updatedMatch.winnerRegistrationId) {
        const winnerReg = await getRegistrationWithMember(
          updatedMatch.winnerRegistrationId,
        );
        progressionInfo.winnerName =
          winnerReg?.member?.displayName || "Le joueur";
        progressionInfo.winnerRegistrationId =
          updatedMatch.winnerRegistrationId;
      }

      if (progressionResult.nextLevelToOrganize?.type === "PHASE") {
        progressionInfo.nextPhaseId = progressionResult.nextLevelToOrganize.id;
      }
    }

    // Sync cumulative edition results for both participants
    if (updatedMatch.participant1RegistrationId) {
      await updateEditionResultForParticipant(
        updatedMatch.participant1RegistrationId,
        updatedMatch.editionId,
      );
    }
    if (updatedMatch.participant2RegistrationId) {
      await updateEditionResultForParticipant(
        updatedMatch.participant2RegistrationId,
        updatedMatch.editionId,
      );
    }

    return { match: updatedMatch, ...progressionInfo };
  } catch (error) {
    console.error("Error admin confirming match result:", error);
    throw error;
  }
}

/**
 * Helper to check if a user is linked to a registration
 */
async function isUserRegistered(
  userId: string,
  registrationId: string,
): Promise<boolean> {
  const reg = await db.query.editionRegistrations.findFirst({
    where: eq(editionRegistrations.id, registrationId),
    with: {
      member: true,
    },
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
  submittedByUserId: string,
): Promise<Match> {
  const res = await adminConfirmMatchResult(id, score1, score2);
  return res.match;
}

/**
 * Liste les matches avec filtres
 */
export async function createEditionResult(
  resultData: NewEditionResult,
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
          eq(editionResults.registrationId, resultData.registrationId),
        ),
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
  resultData: Partial<NewEditionResult>,
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
  query: ListQuery<EditionResultFilters> = {},
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

export async function addQualifiedToNextPhase({
  registrationId,
  nextPhaseId,
  editionId,
}: {
  registrationId: string;
  nextPhaseId: string;
  editionId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier que la registration existe
    const registration = await db.query.editionRegistrations.findFirst({
      where: eq(editionRegistrations.id, registrationId),
    });

    if (!registration) {
      return { success: false, error: "Inscription introuvable" };
    }

    // Vérifier que la phase suivante existe
    const nextPhase = await db.query.tournamentPhases.findFirst({
      where: eq(tournamentPhases.id, nextPhaseId),
    });

    if (!nextPhase) {
      return { success: false, error: "Phase suivante introuvable" };
    }

    // Pour une phase d'élimination, créer un bracket node ou ajouter à un match existant
    if (nextPhase.phaseType === "ELIMINATION") {
      // 🛡️ Vérifier si le participant est déjà présent dans un match de la phase suivante
      const alreadyInPhase = await db.query.matches.findFirst({
        where: and(
          eq(matches.phaseId, nextPhaseId),
          or(
            eq(matches.participant1RegistrationId, registrationId),
            eq(matches.participant2RegistrationId, registrationId),
          ),
        ),
      });

      if (alreadyInPhase) {
        return { success: true }; // Déjà positionné, opération idempotente
      }

      // Logique pour ajouter le participant au bracket
      // Soit créer un nouveau match, soit ajouter à un match existant avec un slot libre
      const existingMatches = await db.query.matches.findMany({
        where: and(
          eq(matches.phaseId, nextPhaseId),
          eq(matches.editionId, editionId),
          or(
            isNull(matches.participant1RegistrationId),
            isNull(matches.participant2RegistrationId),
          ),
        ),
        limit: 1,
      });

      if (existingMatches.length > 0) {
        const match = existingMatches[0];
        const updateData: any = {};

        if (!match.participant1RegistrationId) {
          updateData.participant1RegistrationId = registrationId;
        } else if (!match.participant2RegistrationId && match.participant1RegistrationId !== registrationId) {
          updateData.participant2RegistrationId = registrationId;
        }

        await db
          .update(matches)
          .set(updateData)
          .where(eq(matches.id, match.id));
      } else {
        // Créer un nouveau bracket node et match
        const [node] = await db
          .insert(bracketNodes)
          .values({
            phaseId: nextPhaseId,
            nodeCode: `Q-${Date.now()}`,
            round: 1,
            matchNumber: 1,
            bracketType: "UPPER",
            order: 0,
            metadata: { participants: [registrationId] },
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        await db.insert(matches).values({
          editionId,
          phaseId: nextPhaseId,
          bracketNodeId: node.id,
          participant1RegistrationId: registrationId,
          status: "PENDING",
          round: 1,
          matchNumber: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Pour une phase de groupes, ajouter le participant à un groupe
    if (nextPhase.phaseType === "GROUP_STAGE") {
      const groups = await db.query.phaseGroups.findMany({
        where: eq(phaseGroups.phaseId, nextPhaseId),
        with: { participants: true },
      });

      // Trouver le groupe avec le moins de participants
      const sortedGroups = groups.sort(
        (a, b) => (a.participants?.length || 0) - (b.participants?.length || 0),
      );

      if (sortedGroups.length > 0) {
        const targetGroup = sortedGroups[0];
        await db.insert(phaseGroupParticipants).values({
          groupId: targetGroup.id,
          registrationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        return {
          success: false,
          error: "Aucun groupe disponible dans la phase suivante",
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding qualified to next phase:", error);
    return { success: false, error: String(error) };
  }
}
