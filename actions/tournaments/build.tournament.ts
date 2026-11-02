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


export async function buildTournamentWhereConditions(
  filters: TournamentFilters,
  options: QueryOptions = {},
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
      eq(tournaments.requiresAccessCode, filters.requiresAccessCode),
    );
  }
  if (filters.themeId)
    conditions.push(eq(tournaments.themeId, filters.themeId));

  if (filters.maxParticipantsPerEditionMin !== undefined) {
    conditions.push(
      gte(
        tournaments.maxParticipantsPerEdition,
        filters.maxParticipantsPerEditionMin,
      ),
    );
  }
  if (filters.maxParticipantsPerEditionMax !== undefined) {
    conditions.push(
      lte(
        tournaments.maxParticipantsPerEdition,
        filters.maxParticipantsPerEditionMax,
      ),
    );
  }
  if (filters.totalParticipantsMin !== undefined) {
    conditions.push(
      gte(tournaments.totalParticipants, filters.totalParticipantsMin),
    );
  }
  if (filters.totalParticipantsMax !== undefined) {
    conditions.push(
      lte(tournaments.totalParticipants, filters.totalParticipantsMax),
    );
  }
  if (filters.totalPrizePoolMin !== undefined) {
    conditions.push(
      gte(tournaments.totalPrizePool, String(filters.totalPrizePoolMin)),
    );
  }
  if (filters.totalPrizePoolMax !== undefined) {
    conditions.push(
      lte(tournaments.totalPrizePool, String(filters.totalPrizePoolMax)),
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