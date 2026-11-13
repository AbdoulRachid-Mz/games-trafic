"use server";

/**
 * actions/documents.ts
 *
 * Actions serveur UNIQUES de construction des documents exportables.
 *
 * Garanties :
 * - l'utilisateur est TOUJOURS authentifié côté serveur ;
 * - l'accès est vérifié (organisateur du tournoi / admin, ou propriétaire de
 *   la boutique / admin) AVANT toute lecture de données ;
 * - le client ne fournit que des identifiants et des filtres d'affichage,
 *   jamais les données exportées ;
 * - aucun secret (mot de passe de compte, token, clé) n'est sélectionné.
 */

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import {
  bracketNodes,
  categories,
  editionRegistrations,
  matches as matchesTable,
  orders,
  phaseGroups,
  products,
  shops,
  tournamentEditions,
  tournamentPhases,
  users,
  walletTransactions,
} from "@/database/schema";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccountBalance } from "@/lib/ledger/ledger-utils";
import {
  buildBracketDocument,
  buildEditionParticipantsDocument,
  buildEditionReportDocument,
  buildMatchesDocument,
  buildStandingsDocument,
  buildMatchSheetDocument,
  type BracketNodeRow,
  type EditionInfo,
  type EditionMatchRow,
  type EditionParticipantRow,
  type EditionStandingRow,
} from "@/lib/documents/builders/edition";
import {
  buildShopClientsDocument,
  buildShopOrdersDocument,
  buildShopProductsDocument,
  buildShopWalletDocument,
  type ShopClientRow,
  type ShopInfo,
  type ShopOrderRow,
  type ShopProductRow,
  type ShopWalletRow,
} from "@/lib/documents/builders/shop";
import type { DocumentPayloadResult } from "@/lib/documents/types";
import { getEditionStandings, getPhaseStandings } from "./phases";
import { getMatchesWithParticipants } from "./phases/queries";
import { isUserTournamentOrganizer } from "./tournaments/tournaments";
import { getShopClients } from "./shops";

/* -------------------------------------------------------------------------- */
/* Authentification et autorisations                                          */
/* -------------------------------------------------------------------------- */

function isAdminUser(user: any): boolean {
  return user?.role === "admin" || user?.isAdmin === true;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Une erreur est survenue lors de la construction du document.";
}

async function loadEditionForDocuments(editionId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Non authentifié");

  const edition = await db.query.tournamentEditions.findFirst({
    where: and(
      eq(tournamentEditions.id, editionId),
      eq(tournamentEditions.isDeleted, false),
    ),
    with: {
      tournament: {
        with: {
          organizer: { columns: { username: true, fullName: true } },
        },
      },
    },
  });
  if (!edition) throw new Error("Édition introuvable");

  if (!isAdminUser(currentUser)) {
    const isOrganizer = await isUserTournamentOrganizer(
      edition.tournamentId,
      currentUser.id,
    );
    if (!isOrganizer) {
      throw new Error(
        "Accès refusé — vous n'êtes pas organisateur de ce tournoi.",
      );
    }
  }

  return { currentUser, edition, isAdmin: isAdminUser(currentUser) };
}

async function loadShopForDocuments(shopId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Non authentifié");

  const shop = await db.query.shops.findFirst({
    where: and(eq(shops.id, shopId), eq(shops.isDeleted, false)),
    with: {
      owner: { columns: { username: true, fullName: true } },
    },
  });
  if (!shop) throw new Error("Boutique introuvable");
  if (!isAdminUser(currentUser) && shop.ownerId !== currentUser.id) {
    throw new Error("Accès refusé — vous n'êtes pas propriétaire de cette boutique.");
  }

  return { currentUser, shop, isAdmin: isAdminUser(currentUser) };
}

/* -------------------------------------------------------------------------- */
/* Helpers de mapping                                                         */
/* -------------------------------------------------------------------------- */

function generatedByLabel(user: any): string {
  return user?.username || user?.fullName || "";
}

function mapEditionInfo(edition: any): EditionInfo {
  const tournament = edition.tournament;
  const organizer = tournament?.organizer;
  return {
    id: edition.id,
    name: edition.name || `Édition ${edition.editionNumber}`,
    editionNumber: edition.editionNumber,
    tournamentId: edition.tournamentId,
    tournamentName: tournament?.name ?? "Tournoi",
    game: tournament?.game ?? null,
    format: edition.editionConfig?.competitionType ?? null,
    status: edition.status ?? null,
    startDate: edition.startDate ?? null,
    endDate: edition.endDate ?? null,
    organizerName:
      organizer?.fullName || organizer?.username || null,
    location: edition.location ?? null,
  };
}

function participantName(registration: any): string {
  return (
    registration?.member?.displayName ||
    registration?.member?.user?.username ||
    registration?.member?.user?.fullName ||
    "Anonyme"
  );
}

async function loadEditionParticipants(
  editionId: string,
): Promise<EditionParticipantRow[]> {
  const [registrations, standings] = await Promise.all([
    db.query.editionRegistrations.findMany({
      where: and(
        eq(editionRegistrations.editionId, editionId),
        eq(editionRegistrations.isDeleted, false),
      ),
      orderBy: [asc(editionRegistrations.registeredAt)],
      with: {
        member: {
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                profileImage: true,
                image: true,
              },
            },
            team: { columns: { id: true, name: true, logo: true } },
          },
        },
        results: {
          columns: {
            position: true,
            matchesPlayed: true,
            matchesWon: true,
            matchesDrawn: true,
            matchesLost: true,
          },
        },
      },
    }),
    getEditionStandings(editionId),
  ]);

  const standingByRegistration = new Map(
    (standings?.rows ?? []).map((row) => [row.registrationId, row]),
  );

  return registrations.map((registration: any) => {
    const standing = standingByRegistration.get(registration.id);
    const result = registration.results?.[0];
    return {
      registrationId: registration.id,
      displayName: participantName(registration),
      username: registration.member?.user?.username ?? null,
      email:
        registration.member?.contactEmail ||
        registration.member?.user?.email ||
        null,
      teamName: registration.member?.team?.name ?? null,
      status: registration.status ?? null,
      registrationType: registration.registrationType ?? null,
      checkedIn: registration.checkedIn ?? false,
      feePaid: registration.feePaid ?? false,
      registeredAt: registration.registeredAt ?? null,
      matchesPlayed: standing?.matchesPlayed ?? result?.matchesPlayed ?? 0,
      matchesWon: standing?.matchesWon ?? result?.matchesWon ?? 0,
      matchesDrawn: standing?.matchesDrawn ?? result?.matchesDrawn ?? 0,
      matchesLost: standing?.matchesLost ?? result?.matchesLost ?? 0,
      points: standing?.points ?? 0,
      position: standing?.position ?? result?.position ?? null,
    };
  });
}

function mapMatchRow(match: any): EditionMatchRow {
  const registration1 = match.participant1;
  const registration2 = match.participant2;
  const winnerRegistration =
    match.winnerRegistrationId &&
    [registration1, registration2].find(
      (registration) => registration?.id === match.winnerRegistrationId,
    );

  return {
    id: match.id,
    code: match.matchCode || `M${match.matchNumber ?? ""}`,
    phaseName: match.phase?.name ?? null,
    groupName: match.group?.name ?? null,
    round: match.round ?? null,
    matchNumber: match.matchNumber ?? null,
    participant1Name: registration1 ? participantName(registration1) : "",
    participant2Name: registration2 ? participantName(registration2) : "",
    score1: match.score1 ?? null,
    score2: match.score2 ?? null,
    winnerName: winnerRegistration ? participantName(winnerRegistration) : null,
    status: match.status ?? null,
    matchType: match.matchType ?? null,
    scheduledTime: match.scheduledTime ?? null,
    actualStartTime: match.actualStartTime ?? null,
    actualEndTime: match.actualEndTime ?? null,
    duration: match.duration ?? null,
  };
}

interface EditionMatchDocumentFilters {
  phaseId?: string;
  groupId?: string;
  bracketNodeId?: string;
  status?: string;
  search?: string;
}

async function loadEditionMatches(
  editionId: string,
  filters: EditionMatchDocumentFilters = {},
): Promise<EditionMatchRow[]> {
  const query: any = { editionId };
  if (filters.phaseId) query.phaseId = filters.phaseId;
  if (filters.groupId) query.groupId = filters.groupId;
  if (filters.bracketNodeId) query.bracketNodeId = filters.bracketNodeId;
  if (filters.status) query.statuses = [filters.status];
  if (filters.search) query.search = filters.search;

  const response = await getMatchesWithParticipants({
    filters: query,
    pagination: { page: 1, limit: 5000 },
    options: { sortBy: "scheduledTime", sortOrder: "asc" },
  });

  return (response.data as any[]).map(mapMatchRow);
}

function mapStandingRows(
  rows: any[],
  groupName?: string,
): EditionStandingRow[] {
  return rows.map((row) => ({
    registrationId: row.registrationId,
    position: row.position ?? null,
    displayName: row.displayName ?? "Anonyme",
    teamName: row.teamName ?? null,
    groupName: groupName ?? null,
    matchesPlayed: row.matchesPlayed ?? 0,
    matchesWon: row.matchesWon ?? 0,
    matchesDrawn: row.matchesDrawn ?? 0,
    matchesLost: row.matchesLost ?? 0,
    scoreFor: row.scoreFor ?? 0,
    scoreAgainst: row.scoreAgainst ?? 0,
    scoreDifference: row.scoreDifference ?? 0,
    points: row.points ?? 0,
    qualified: row.qualified ?? false,
  }));
}

/* -------------------------------------------------------------------------- */
/* Documents d'édition                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Résout, côté serveur et dans le périmètre de l'édition, les libellés des
 * filtres d'export (phase / groupe / nœud de bracket). Aucun libellé n'est
 * accepté depuis le client.
 */
async function resolveMatchScopeLabels(
  editionId: string,
  filters: EditionMatchDocumentFilters,
): Promise<Record<string, string>> {
  const labels: Record<string, string> = {};

  if (filters.phaseId) {
    const phase = await db.query.tournamentPhases.findFirst({
      where: and(
        eq(tournamentPhases.id, filters.phaseId),
        eq(tournamentPhases.editionId, editionId),
        eq(tournamentPhases.isDeleted, false),
      ),
      columns: { name: true },
    });
    if (!phase) throw new Error("Phase introuvable pour cette édition");
    labels.phase = phase.name;
  }

  if (filters.groupId) {
    const group = await db.query.phaseGroups.findFirst({
      where: and(
        eq(phaseGroups.id, filters.groupId),
        eq(phaseGroups.isDeleted, false),
      ),
      columns: { name: true },
      with: { phase: { columns: { editionId: true } } },
    });
    if (!group || group.phase?.editionId !== editionId) {
      throw new Error("Groupe introuvable pour cette édition");
    }
    labels.groupe = group.name;
  }

  if (filters.bracketNodeId) {
    const node = await db.query.bracketNodes.findFirst({
      where: and(
        eq(bracketNodes.id, filters.bracketNodeId),
        eq(bracketNodes.isDeleted, false),
      ),
      columns: { nodeCode: true },
      with: { phase: { columns: { editionId: true } } },
    });
    if (!node || node.phase?.editionId !== editionId) {
      throw new Error("Nœud de bracket introuvable pour cette édition");
    }
    labels.bracket = node.nodeCode ?? filters.bracketNodeId;
  }

  return labels;
}

export async function getEditionParticipantsDocument(
  editionId: string,
): Promise<DocumentPayloadResult> {
  try {
    const { currentUser, edition } = await loadEditionForDocuments(editionId);
    const participants = await loadEditionParticipants(editionId);
    return {
      success: true,
      document: buildEditionParticipantsDocument({
        edition: mapEditionInfo(edition),
        participants,
        context: { generatedBy: generatedByLabel(currentUser) },
      }),
    };
  } catch (error) {
    console.error("getEditionParticipantsDocument", error);
    return { success: false, error: errorMessage(error) };
  }
}

export async function getEditionMatchesDocument(
  editionId: string,
  filters: EditionMatchDocumentFilters = {},
): Promise<DocumentPayloadResult> {
  try {
    const { currentUser, edition } = await loadEditionForDocuments(editionId);
    const [rows, scopeLabels] = await Promise.all([
      loadEditionMatches(editionId, filters),
      resolveMatchScopeLabels(editionId, filters),
    ]);
    return {
      success: true,
      document: buildMatchesDocument({
        edition: mapEditionInfo(edition),
        matches: rows,
        context: {
          generatedBy: generatedByLabel(currentUser),
          filters: {
            ...(scopeLabels.phase ? { phase: scopeLabels.phase } : {}),
            ...(scopeLabels.groupe ? { groupe: scopeLabels.groupe } : {}),
            ...(scopeLabels.bracket ? { bracket: scopeLabels.bracket } : {}),
            ...(filters.status ? { statut: filters.status } : {}),
            ...(filters.search ? { recherche: filters.search } : {}),
          },
        },
      }),
    };
  } catch (error) {
    console.error("getEditionMatchesDocument", error);
    return { success: false, error: errorMessage(error) };
  }
}

export async function getEditionMatchSheetDocument(
  editionId: string,
  matchId: string,
): Promise<DocumentPayloadResult> {
  try {
    const { currentUser, edition } = await loadEditionForDocuments(editionId);
    const match = await db.query.matches.findFirst({
      where: and(
        eq(matchesTable.id, matchId),
        eq(matchesTable.editionId, editionId),
        eq(matchesTable.isDeleted, false),
      ),
      with: {
        participant1: {
          with: {
            member: {
              with: {
                user: { columns: { username: true, fullName: true } },
                team: { columns: { name: true } },
              },
            },
          },
        },
        participant2: {
          with: {
            member: {
              with: {
                user: { columns: { username: true, fullName: true } },
                team: { columns: { name: true } },
              },
            },
          },
        },
        phase: { columns: { name: true } },
        group: { columns: { name: true } },
      },
    });
    if (!match) throw new Error("Match introuvable");

    return {
      success: true,
      document: buildMatchSheetDocument({
        edition: mapEditionInfo(edition),
        match: mapMatchRow(match),
        notes: match.notes ?? null,
        streamLink: match.streamLink ?? null,
        context: { generatedBy: generatedByLabel(currentUser) },
      }),
    };
  } catch (error) {
    console.error("getEditionMatchSheetDocument", error);
    return { success: false, error: errorMessage(error) };
  }
}

export async function getEditionStandingsDocument(
  editionId: string,
  phaseId?: string | null,
): Promise<DocumentPayloadResult> {
  try {
    const { currentUser, edition } = await loadEditionForDocuments(editionId);

    if (phaseId) {
      const phase = await db.query.tournamentPhases.findFirst({
        where: and(
          eq(tournamentPhases.id, phaseId),
          eq(tournamentPhases.editionId, editionId),
          eq(tournamentPhases.isDeleted, false),
        ),
        columns: { id: true, name: true },
      });
      if (!phase) throw new Error("Phase introuvable pour cette édition");

      const groups = await getPhaseStandings(phaseId);
      const standings: EditionStandingRow[] = groups.flatMap((group: any) =>
        mapStandingRows(group.rows ?? [], groups.length > 1 ? group.groupName : undefined),
      );

      return {
        success: true,
        document: buildStandingsDocument({
          edition: mapEditionInfo(edition),
          scope: "phase",
          scopeName: phase.name,
          standings,
          context: { generatedBy: generatedByLabel(currentUser) },
        }),
      };
    }

    const standings = await getEditionStandings(editionId);
    if (!standings) throw new Error("Classement introuvable");

    return {
      success: true,
      document: buildStandingsDocument({
        edition: mapEditionInfo(edition),
        scope: "edition",
        standings: mapStandingRows(standings.rows),
        context: { generatedBy: generatedByLabel(currentUser) },
      }),
    };
  } catch (error) {
    console.error("getEditionStandingsDocument", error);
    return { success: false, error: errorMessage(error) };
  }
}

export async function getBracketDocument(
  editionId: string,
  phaseId?: string | null,
): Promise<DocumentPayloadResult> {
  try {
    const { currentUser, edition } = await loadEditionForDocuments(editionId);

    const phases = await db.query.tournamentPhases.findMany({
      where: and(
        eq(tournamentPhases.editionId, editionId),
        eq(tournamentPhases.isDeleted, false),
      ),
      columns: { id: true, name: true },
      orderBy: [asc(tournamentPhases.order)],
    });
    if (phases.length === 0) throw new Error("Aucune phase pour cette édition");

    const selectedPhase = phaseId
      ? phases.find((phase: any) => phase.id === phaseId)
      : undefined;
    if (phaseId && !selectedPhase) {
      throw new Error("Phase introuvable pour cette édition");
    }

    const phaseIds = selectedPhase
      ? [selectedPhase.id]
      : phases.map((phase: any) => phase.id);

    const nodes = await db.query.bracketNodes.findMany({
      where: and(
        inArray(bracketNodes.phaseId, phaseIds),
        eq(bracketNodes.isDeleted, false),
      ),
      orderBy: [
        asc(bracketNodes.round),
        asc(bracketNodes.order),
        asc(bracketNodes.matchNumber),
      ],
      with: {
        phase: { columns: { id: true, name: true } },
        matches: {
          columns: {
            score1: true,
            score2: true,
            status: true,
            scheduledTime: true,
            isDeleted: true,
          },
        },
        winnerRegistration: {
          with: {
            member: {
              with: {
                user: { columns: { username: true, fullName: true } },
                team: { columns: { name: true } },
              },
            },
          },
        },
      },
    });

    const rows: BracketNodeRow[] = nodes.map((node: any) => {
      const metadataParticipants = Array.isArray(node.metadata?.participants)
        ? node.metadata.participants
        : [];
      const names = metadataParticipants.map((participant: any, index: number) => {
        if (!participant) return "";
        if (typeof participant === "string") {
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              participant,
            );
          return isUuid ? `Participant ${index + 1}` : participant;
        }
        return (
          participant.displayName ||
          participant.username ||
          participant.teamName ||
          `Participant ${index + 1}`
        );
      });
      const activeMatch = (node.matches ?? []).find(
        (match: any) => !match.isDeleted,
      );

      return {
        round: node.round ?? null,
        nodeCode: node.nodeCode ?? null,
        matchNumber: node.matchNumber ?? null,
        participant1Name: names[0] ?? "",
        participant2Name: names[1] ?? "",
        score1: activeMatch?.score1 ?? null,
        score2: activeMatch?.score2 ?? null,
        winnerName: node.winnerRegistration
          ? participantName(node.winnerRegistration)
          : null,
        status: node.isCompleted ? "COMPLETED" : activeMatch?.status ?? null,
        isCompleted: node.isCompleted ?? false,
        scheduledTime: activeMatch?.scheduledTime ?? null,
      };
    });

    return {
      success: true,
      document: buildBracketDocument({
        edition: mapEditionInfo(edition),
        phaseName: selectedPhase?.name ?? null,
        nodes: rows,
        context: { generatedBy: generatedByLabel(currentUser) },
      }),
    };
  } catch (error) {
    console.error("getBracketDocument", error);
    return { success: false, error: errorMessage(error) };
  }
}

export async function getEditionReportDocument(
  editionId: string,
): Promise<DocumentPayloadResult> {
  try {
    const { currentUser, edition } = await loadEditionForDocuments(editionId);
    const [participants, matchRows, standings] = await Promise.all([
      loadEditionParticipants(editionId),
      loadEditionMatches(editionId),
      getEditionStandings(editionId),
    ]);

    return {
      success: true,
      document: buildEditionReportDocument({
        edition: mapEditionInfo(edition),
        participants,
        matches: matchRows,
        standings: mapStandingRows(standings?.rows ?? []),
        prizePool:
          edition.prizePool !== null && edition.prizePool !== undefined
            ? {
                amount: edition.prizePool,
                currency: edition.prizeCurrency ?? "GTC",
              }
            : null,
        context: { generatedBy: generatedByLabel(currentUser) },
      }),
    };
  } catch (error) {
    console.error("getEditionReportDocument", error);
    return { success: false, error: errorMessage(error) };
  }
}

/* -------------------------------------------------------------------------- */
/* Documents de boutique                                                      */
/* -------------------------------------------------------------------------- */

function mapShopInfo(shop: any): ShopInfo {
  return {
    id: shop.id,
    name: shop.name,
    ownerName:
      shop.owner?.fullName || shop.owner?.username || null,
    country: shop.country ?? null,
    website: shop.website ?? null,
    verified: shop.verified ?? false,
    createdAt: shop.createdAt ?? null,
  };
}

export async function getShopProductsDocument(
  shopId: string,
): Promise<DocumentPayloadResult> {
  try {
    const { currentUser, shop } = await loadShopForDocuments(shopId);

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        game: products.game,
        platform: products.platform,
        price: products.price,
        currency: products.currency,
        status: products.status,
        viewCount: products.viewCount,
        isActive: products.isActive,
        createdAt: products.createdAt,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.shopId, shopId), eq(products.isDeleted, false)))
      .orderBy(desc(products.createdAt))
      .limit(5000);

    const productRows: ShopProductRow[] = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      categoryName: row.categoryName ?? null,
      game: row.game ?? null,
      platform: row.platform ?? null,
      price: row.price,
      currency: row.currency ?? "GTC",
      status: row.status ?? null,
      viewCount: row.viewCount ?? 0,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt ?? null,
    }));

    return {
      success: true,
      document: buildShopProductsDocument({
        shop: mapShopInfo(shop),
        products: productRows,
        context: { generatedBy: generatedByLabel(currentUser) },
      }),
    };
  } catch (error) {
    console.error("getShopProductsDocument", error);
    return { success: false, error: errorMessage(error) };
  }
}

export async function getShopOrdersDocument(
  shopId: string,
): Promise<DocumentPayloadResult> {
  try {
    const { currentUser, shop } = await loadShopForDocuments(shopId);

    const rows = await db
      .select({
        id: orders.id,
        createdAt: orders.createdAt,
        price: orders.price,
        status: orders.status,
        orderType: orders.orderType,
        buyerUsername: users.username,
        buyerFullName: users.fullName,
        productName: products.name,
      })
      .from(orders)
      .innerJoin(users, eq(orders.buyerId, users.id))
      .innerJoin(products, eq(orders.productId, products.id))
      .where(and(eq(orders.shopId, shopId), eq(orders.isDeleted, false)))
      .orderBy(desc(orders.createdAt))
      .limit(5000);

    const orderRows: ShopOrderRow[] = rows.map((row: any) => ({
      id: row.id,
      reference: `ORD-${String(row.id).slice(-8).toUpperCase()}`,
      createdAt: row.createdAt ?? null,
      buyerName: row.buyerFullName || row.buyerUsername || "Client",
      productName: row.productName ?? "",
      price: row.price,
      currency: "GTC",
      status: row.status ?? null,
      orderType: row.orderType ?? null,
    }));

    return {
      success: true,
      document: buildShopOrdersDocument({
        shop: mapShopInfo(shop),
        orders: orderRows,
        context: { generatedBy: generatedByLabel(currentUser) },
      }),
    };
  } catch (error) {
    console.error("getShopOrdersDocument", error);
    return { success: false, error: errorMessage(error) };
  }
}

export async function getShopClientsDocument(
  shopId: string,
): Promise<DocumentPayloadResult> {
  try {
    const { currentUser, shop } = await loadShopForDocuments(shopId);
    const clients = await getShopClients(shopId);

    const clientRows: ShopClientRow[] = (clients as any[]).map((client) => ({
      id: client.id,
      username: client.username ?? "Client",
      fullName: client.fullName ?? null,
      email: client.email ?? null,
      orderCount: Number(client.orderCount ?? 0),
      totalSpent: client.totalSpent ?? 0,
      lastOrderDate: client.lastOrderDate ?? null,
    }));

    return {
      success: true,
      document: buildShopClientsDocument({
        shop: mapShopInfo(shop),
        clients: clientRows,
        context: { generatedBy: generatedByLabel(currentUser) },
      }),
    };
  } catch (error) {
    console.error("getShopClientsDocument", error);
    return { success: false, error: errorMessage(error) };
  }
}

export async function getShopWalletDocument(
  shopId: string,
): Promise<DocumentPayloadResult> {
  try {
    const { currentUser, shop } = await loadShopForDocuments(shopId);

    if (!shop.financialAccountId) {
      throw new Error(
        "Cette boutique ne possède pas encore de compte financier.",
      );
    }

    const [balance, transactions] = await Promise.all([
      getAccountBalance(shop.financialAccountId),
      db.query.walletTransactions.findMany({
        where: and(
          eq(
            walletTransactions.financialAccountId,
            shop.financialAccountId,
          ),
          eq(walletTransactions.isDeleted, false),
        ),
        orderBy: [desc(walletTransactions.createdAt)],
        limit: 5000,
      }),
    ]);

    const walletRows: ShopWalletRow[] = transactions.map((entry: any) => ({
      id: entry.id,
      reference: entry.reference ?? null,
      createdAt: entry.createdAt ?? null,
      type: entry.type ?? null,
      description: entry.description ?? null,
      amount: entry.amount,
      fees: entry.fees ?? 0,
      netAmount: entry.netAmount ?? entry.amount,
      currency: entry.currency ?? "GTC",
      status: entry.status ?? null,
    }));

    return {
      success: true,
      document: buildShopWalletDocument({
        shop: mapShopInfo(shop),
        entries: walletRows,
        balance,
        currency: transactions[0]?.currency ?? "GTC",
        context: { generatedBy: generatedByLabel(currentUser) },
      }),
    };
  } catch (error) {
    console.error("getShopWalletDocument", error);
    return { success: false, error: errorMessage(error) };
  }
}
