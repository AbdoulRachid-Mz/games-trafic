import {
  tournamentPhases,
  phaseGroups,
  phaseGroupParticipants,
  bracketNodes,
  matches,
  tournamentEditions,
} from "@/database/schema";
import {
  eq,
  and,
  ilike,
  inArray,
  gte,
  lte,
} from "drizzle-orm";
import {
  type TournamentPhaseFilters,
  type PhaseGroupFilters,
  type PhaseGroupParticipantFilters,
  type BracketNodeFilters,
  type MatchFilters,
  type QueryOptions,
} from "@/types/api";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isUserTournamentOrganizer } from "@/actions/tournaments";

export const FINAL_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

export function isMatchPending(status?: string | null) {
  return !status || !FINAL_STATUSES.has(status);
}

export function groupMatchesBy<T extends { [key: string]: any }>(
  matchesList: T[],
  key: keyof T,
) {
  const map = new Map<string, T[]>();

  for (const m of matchesList) {
    const k = m[key];
    if (!k) continue;

    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(m);
  }

  return map;
}

export function hasPending(matchesList: { status?: string | null }[]) {
  return matchesList.some((m) => isMatchPending(m.status));
}

export function getEliminationRoundName(participantCount: number): string {
  switch (participantCount) {
    case 2:
      return "Finale";
    case 4:
      return "Demi-finale";
    case 8:
      return "Quart de finale";
    case 16:
      return "Huitième de finale";
    case 32:
      return "Seizième de finale";
    case 64:
      return "Trente-deuxième de finale";
    default:
      return `Top ${participantCount}`;
  }
}

export async function getWinnersFromGroups(tx: any, groupIds: string[]) {
  const nodes = await tx.query.bracketNodes.findMany({
    where: and(
      inArray(bracketNodes.groupId, groupIds),
      eq(bracketNodes.isCompleted, true),
    ),
  });

  return nodes
    .map((n: any) => n.winnerRegistrationId)
    .filter(Boolean) as string[];
}

// SEC-07 FIX: Helpers for access control on tournament phases and edition structures
export async function assertOrganizerOrAdminByEdition(editionId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Non authentifié");
  const isAdmin = currentUser.role === "admin" || (currentUser as any).isAdmin === true;
  if (isAdmin) return currentUser;

  const edition = await db.query.tournamentEditions.findFirst({
    where: eq(tournamentEditions.id, editionId),
    columns: { tournamentId: true },
  });
  if (!edition) throw new Error("Édition non trouvée");

  const isOrganizer = await isUserTournamentOrganizer(edition.tournamentId, currentUser.id);
  if (!isOrganizer) throw new Error("Accès refusé — vous n'êtes pas organisateur de ce tournoi");
  return currentUser;
}

export async function assertOrganizerOrAdminByPhase(phaseId: string) {
  const phase = await db.query.tournamentPhases.findFirst({
    where: eq(tournamentPhases.id, phaseId),
    columns: { editionId: true },
  });
  if (!phase) throw new Error("Phase non trouvée");
  return assertOrganizerOrAdminByEdition(phase.editionId);
}

export function buildTournamentPhaseWhereConditions(
  filters: TournamentPhaseFilters,
  options: QueryOptions = {},
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
  if (typeof filters.isActive === "boolean") {
    conditions.push(eq(tournamentPhases.isActive, filters.isActive));
  }
  if (typeof filters.isCompleted === "boolean") {
    conditions.push(eq(tournamentPhases.isCompleted, filters.isCompleted));
  }
  if (typeof filters.isDoubleElimination === "boolean") {
    conditions.push(
      eq(tournamentPhases.isDoubleElimination, filters.isDoubleElimination),
    );
  }
  if (typeof filters.isHidden === "boolean") {
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
      gte(
        tournamentPhases.scheduledStart,
        new Date(filters.scheduledStartFrom),
      ),
    );
  }
  if (filters.scheduledStartTo) {
    conditions.push(
      lte(tournamentPhases.scheduledStart, new Date(filters.scheduledStartTo)),
    );
  }
  if (filters.scheduledEndFrom) {
    conditions.push(
      gte(tournamentPhases.scheduledEnd, new Date(filters.scheduledEndFrom)),
    );
  }
  if (filters.scheduledEndTo) {
    conditions.push(
      lte(tournamentPhases.scheduledEnd, new Date(filters.scheduledEndTo)),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export function buildPhaseGroupWhereConditions(
  filters: PhaseGroupFilters,
  options: QueryOptions = {},
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
  if (typeof filters.isCompleted === "boolean") {
    conditions.push(eq(phaseGroups.isCompleted, filters.isCompleted));
  }
  if (typeof filters.isLocked === "boolean") {
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

export function buildPhaseGroupParticipantWhereConditions(
  filters: PhaseGroupParticipantFilters,
  options: QueryOptions = {},
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
    conditions.push(
      eq(phaseGroupParticipants.registrationId, filters.registrationId),
    );
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
    conditions.push(
      gte(phaseGroupParticipants.matchesPlayed, filters.matchesPlayedMin),
    );
  }
  if (filters.matchesPlayedMax !== undefined) {
    conditions.push(
      lte(phaseGroupParticipants.matchesPlayed, filters.matchesPlayedMax),
    );
  }
  if (filters.matchesWonMin !== undefined) {
    conditions.push(
      gte(phaseGroupParticipants.matchesWon, filters.matchesWonMin),
    );
  }
  if (filters.matchesWonMax !== undefined) {
    conditions.push(
      lte(phaseGroupParticipants.matchesWon, filters.matchesWonMax),
    );
  }
  if (filters.isSeeded !== undefined) {
    conditions.push(eq(phaseGroupParticipants.isSeeded, filters.isSeeded));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export function buildBracketNodeWhereConditions(
  filters: BracketNodeFilters,
  options: QueryOptions = {},
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

export function buildMatchWhereConditions(
  filters: MatchFilters = {},
  options: any = {},
) {
  const conditions = [];

  if (!filters.editionId) {
    throw new Error("editionId is required in filters");
  }

  conditions.push(eq(matches.editionId, filters.editionId));

  if (filters.phaseId != null) {
    conditions.push(eq(matches.phaseId, filters.phaseId));
  }

  if (filters.groupId != null) {
    conditions.push(eq(matches.groupId, filters.groupId));
  }

  if (filters.bracketNodeId != null) {
    conditions.push(eq(matches.bracketNodeId, filters.bracketNodeId));
  }

  if (Array.isArray(filters.statuses) && filters.statuses.length > 0) {
    conditions.push(inArray(matches.status, filters.statuses));
  }

  return and(...conditions);
}
