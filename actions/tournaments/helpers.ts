
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


export {
  buildTournamentPhaseWhereConditions,
  buildPhaseGroupWhereConditions,
  buildPhaseGroupParticipantWhereConditions,
  buildBracketNodeWhereConditions,
  buildMatchWhereConditions,
} from "@/actions/phases";

/**
 * Construit les conditions WHERE pour les éditions de tournoi
 */
export function buildTournamentEditionWhereConditions(
  filters: TournamentEditionFilters,
  options: QueryOptions = {},
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
      gte(tournamentEditions.entryFee, String(filters.entryFeeMin)),
    );
  }
  if (filters.entryFeeMax !== undefined) {
    conditions.push(
      lte(tournamentEditions.entryFee, String(filters.entryFeeMax)),
    );
  }
  if (filters.locationType) {
    if (Array.isArray(filters.locationType)) {
      conditions.push(
        inArray(tournamentEditions.locationType, filters.locationType),
      );
    } else {
      conditions.push(
        eq(tournamentEditions.locationType, filters.locationType),
      );
    }
  }

  if (filters.maxParticipantsMin !== undefined) {
    conditions.push(
      gte(tournamentEditions.maxParticipants, filters.maxParticipantsMin),
    );
  }
  if (filters.maxParticipantsMax !== undefined) {
    conditions.push(
      lte(tournamentEditions.maxParticipants, filters.maxParticipantsMax),
    );
  }
  if (filters.currentParticipantsMin !== undefined) {
    conditions.push(
      gte(
        tournamentEditions.currentParticipants,
        filters.currentParticipantsMin,
      ),
    );
  }
  if (filters.currentParticipantsMax !== undefined) {
    conditions.push(
      lte(
        tournamentEditions.currentParticipants,
        filters.currentParticipantsMax,
      ),
    );
  }
  if (filters.onlyAvailable === true) {
    conditions.push(
      sql`${tournamentEditions.currentParticipants} < ${tournamentEditions.maxParticipants}`,
    );
  }
  if (filters.prizePoolMin !== undefined) {
    conditions.push(
      gte(tournamentEditions.prizePool, String(filters.prizePoolMin)),
    );
  }
  if (filters.prizePoolMax !== undefined) {
    conditions.push(
      lte(tournamentEditions.prizePool, String(filters.prizePoolMax)),
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
      gte(tournamentEditions.startDate, new Date(filters.startDateFrom)),
    );
  }
  if (filters.startDateTo) {
    conditions.push(
      lte(tournamentEditions.startDate, new Date(filters.startDateTo)),
    );
  }
  if (filters.endDateFrom) {
    conditions.push(
      gte(tournamentEditions.endDate, new Date(filters.endDateFrom)),
    );
  }
  if (filters.endDateTo) {
    conditions.push(
      lte(tournamentEditions.endDate, new Date(filters.endDateTo)),
    );
  }
  if (filters.registrationOpensFrom) {
    conditions.push(
      gte(
        tournamentEditions.registrationOpens,
        new Date(filters.registrationOpensFrom),
      ),
    );
  }
  if (filters.registrationOpensTo) {
    conditions.push(
      lte(
        tournamentEditions.registrationOpens,
        new Date(filters.registrationOpensTo),
      ),
    );
  }
  if (filters.registrationDeadlineFrom) {
    conditions.push(
      gte(
        tournamentEditions.registrationDeadline,
        new Date(filters.registrationDeadlineFrom),
      ),
    );
  }
  if (filters.registrationDeadlineTo) {
    conditions.push(
      lte(
        tournamentEditions.registrationDeadline,
        new Date(filters.registrationDeadlineTo),
      ),
    );
  }
  if (filters.createdFrom) {
    conditions.push(
      gte(tournamentEditions.createdAt, new Date(filters.createdFrom)),
    );
  }
  if (filters.createdTo) {
    conditions.push(
      lte(tournamentEditions.createdAt, new Date(filters.createdTo)),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les membres de tournoi
 */
export function buildTournamentMemberWhereConditions(
  filters: TournamentMemberFilters,
  options: QueryOptions = {},
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
        inArray(tournamentMembers.verificationLevel, filters.verificationLevel),
      );
    } else {
      conditions.push(
        eq(tournamentMembers.verificationLevel, filters.verificationLevel),
      );
    }
  }
  if (filters.statuses && filters.statuses.length > 0) {
    // Map string statuses to boolean values expected by isActive column
    const statusBooleans = filters.statuses.map(
      (status) => status === "active",
    );
    conditions.push(inArray(tournamentMembers.isActive, statusBooleans));
  }

  if (filters.rankingPointsMin !== undefined) {
    conditions.push(
      gte(tournamentMembers.rankingPoints, filters.rankingPointsMin),
    );
  }
  if (filters.rankingPointsMax !== undefined) {
    conditions.push(
      lte(tournamentMembers.rankingPoints, filters.rankingPointsMax),
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
      gte(tournamentMembers.joinedAt, new Date(filters.joinedFrom)),
    );
  }
  if (filters.joinedTo) {
    conditions.push(
      lte(tournamentMembers.joinedAt, new Date(filters.joinedTo)),
    );
  }
  if (filters.lastActiveFrom) {
    conditions.push(
      gte(tournamentMembers.lastActive, new Date(filters.lastActiveFrom)),
    );
  }
  if (filters.lastActiveTo) {
    conditions.push(
      lte(tournamentMembers.lastActive, new Date(filters.lastActiveTo)),
    );
  }

  if (filters.search) {
    conditions.push(
      or(
        ilike(tournamentMembers.displayName, `%${filters.search}%`),
        ilike(tournamentMembers.gameTag, `%${filters.search}%`),
        ilike(tournamentMembers.contactEmail, `%${filters.search}%`),
      ),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les phases de tournoi
 */
export function buildEditionRegistrationWhereConditions(
  filters: EditionRegistrationFilters,
  options: QueryOptions = {},
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
        inArray(
          editionRegistrations.registrationType,
          filters.registrationType,
        ),
      );
    } else {
      conditions.push(
        eq(editionRegistrations.registrationType, filters.registrationType),
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
        filters.qualifiedFromPrevious,
      ),
    );
  }

  if (filters.registrationFeeMin !== undefined) {
    conditions.push(
      gte(
        editionRegistrations.registrationFee,
        String(filters.registrationFeeMin),
      ),
    );
  }
  if (filters.registrationFeeMax !== undefined) {
    conditions.push(
      lte(
        editionRegistrations.registrationFee,
        String(filters.registrationFeeMax),
      ),
    );
  }

  if (filters.registeredFrom) {
    conditions.push(
      gte(editionRegistrations.registeredAt, new Date(filters.registeredFrom)),
    );
  }
  if (filters.registeredTo) {
    conditions.push(
      lte(editionRegistrations.registeredAt, new Date(filters.registeredTo)),
    );
  }
  if (filters.checkedInFrom) {
    conditions.push(
      gte(editionRegistrations.checkedInAt, new Date(filters.checkedInFrom)),
    );
  }
  if (filters.checkedInTo) {
    conditions.push(
      lte(editionRegistrations.checkedInAt, new Date(filters.checkedInTo)),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les paiements d'inscription
 */
export function buildRegistrationPaymentWhereConditions(
  filters: RegistrationPaymentFilters,
  options: QueryOptions = {},
) {
  const conditions = [];

  if (filters.id) conditions.push(eq(registrationPayments.id, filters.id));
  if (filters.registrationId)
    conditions.push(
      eq(registrationPayments.registrationId, filters.registrationId),
    );
  if (filters.transactionId)
    conditions.push(
      eq(registrationPayments.transactionId, filters.transactionId),
    );
  if (filters.paymentMethod) {
    if (Array.isArray(filters.paymentMethod)) {
      conditions.push(
        inArray(registrationPayments.paymentMethod, filters.paymentMethod),
      );
    } else {
      conditions.push(
        eq(registrationPayments.paymentMethod, filters.paymentMethod),
      );
    }
  }
  if (filters.paymentProvider) {
    if (Array.isArray(filters.paymentProvider)) {
      conditions.push(
        inArray(registrationPayments.paymentProvider, filters.paymentProvider),
      );
    } else {
      conditions.push(
        eq(registrationPayments.paymentProvider, filters.paymentProvider),
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
      gte(registrationPayments.amount, String(filters.amountMin)),
    );
  }
  if (filters.amountMax !== undefined) {
    conditions.push(
      lte(registrationPayments.amount, String(filters.amountMax)),
    );
  }

  if (filters.paidFrom) {
    conditions.push(
      gte(registrationPayments.paidAt, new Date(filters.paidFrom)),
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
export function buildEditionResultWhereConditions(
  filters: EditionResultFilters,
  options: QueryOptions = {},
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
      gte(editionResults.prizeAmount, String(filters.prizeAmountMin)),
    );
  }
  if (filters.prizeAmountMax !== undefined) {
    conditions.push(
      lte(editionResults.prizeAmount, String(filters.prizeAmountMax)),
    );
  }
  if (filters.matchesPlayedMin !== undefined) {
    conditions.push(
      gte(editionResults.matchesPlayed, filters.matchesPlayedMin),
    );
  }
  if (filters.matchesPlayedMax !== undefined) {
    conditions.push(
      lte(editionResults.matchesPlayed, filters.matchesPlayedMax),
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
