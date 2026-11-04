/**
 * lib/finance/requests/credit-requests.ts
 *
 * Demandes d'émission GTC (table dédiée `transaction_credit_requests`).
 * Une demande ne crée AUCUN mouvement ledger avant approbation.
 */

import { db } from "@/lib/db";
import {
  transactionCreditRequests,
  userWallets,
  users,
} from "@/database/schema";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { assertAuthenticated, type AdminLevel } from "@/lib/auth/permissions";
import { FinanceError } from "../core/errors";
import {
  loadFinancePolicy,
  type FinancePolicy,
} from "../policies/limits";
import { writeFinancialAuditLog } from "../audit/audit-log";

type DbClient = typeof db | any;

export type CreditRequest = typeof transactionCreditRequests.$inferSelect;

export interface CreateCreditRequestInput {
  recipientUserId: string;
  recipientWalletId: string;
  amount: number;
  reason: string;
  idempotencyKey?: string;
}

export interface AdminActor {
  id: string;
  level: AdminLevel;
}

/**
 * Relit l'acteur en base : le niveau envoyé par le client n'est jamais utilisé.
 */
export async function loadAdminActor(
  client: DbClient,
  userId: string
): Promise<AdminActor> {
  const [row] = await client
    .select({
      id: users.id,
      isAdmin: users.isAdmin,
      role: users.role,
      level: users.level,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) {
    throw new FinanceError("UNAUTHENTICATED", "Utilisateur introuvable.");
  }
  if (!(row.isAdmin === true || row.role === "admin")) {
    throw new FinanceError(
      "FORBIDDEN",
      "Accès réservé aux administrateurs."
    );
  }

  const level: AdminLevel =
    row.level === "A" || row.level === "B" || row.level === "C"
      ? row.level
      : "C";

  return { id: row.id, level };
}

const startOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const sumToNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function getRequestedToday(
  client: DbClient,
  requesterId: string
): Promise<number> {
  const [row] = await client
    .select({
      total: sql<string>`COALESCE(SUM(${transactionCreditRequests.amount}), 0)`,
    })
    .from(transactionCreditRequests)
    .where(
      and(
        eq(transactionCreditRequests.requesterId, requesterId),
        gte(transactionCreditRequests.createdAt, startOfToday()),
        inArray(transactionCreditRequests.status, ["PENDING", "APPROVED"])
      )
    );

  return sumToNumber(row?.total);
}

function assertRequestWithinPolicy(
  amount: number,
  level: AdminLevel,
  requestedToday: number,
  policy: FinancePolicy
): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new FinanceError("VALIDATION_ERROR", "Le montant doit être positif.");
  }
  if (amount > policy.creditRequest.max[level]) {
    throw new FinanceError(
      "FORBIDDEN",
      `Plafond de demande ${level} dépassé (${policy.creditRequest.max[level]} GTC par demande).`,
      { policyCode: "CREDIT_REQUEST_EXCEEDS_MAX" }
    );
  }
  if (requestedToday + amount > policy.creditRequest.daily[level]) {
    throw new FinanceError(
      "FORBIDDEN",
      `Plafond quotidien de demande ${level} dépassé (${policy.creditRequest.daily[level]} GTC).`,
      { policyCode: "CREDIT_REQUEST_EXCEEDS_DAILY" }
    );
  }
}

/**
 * Crée une demande d'émission. L'acteur vient de la session serveur.
 */
export async function createCreditRequest(
  input: CreateCreditRequestInput
): Promise<CreditRequest> {
  const currentUser = await getCurrentUser();
  assertAuthenticated(currentUser);

  const reason = input.reason?.trim();
  if (!reason) {
    throw new FinanceError(
      "VALIDATION_ERROR",
      "Le motif de la demande est obligatoire."
    );
  }
  if (!input.recipientUserId || !input.recipientWalletId) {
    throw new FinanceError(
      "VALIDATION_ERROR",
      "Le bénéficiaire et son wallet sont obligatoires."
    );
  }

  return db.transaction(async (tx) => {
    const actor = await loadAdminActor(tx, currentUser.id);
    const policy = await loadFinancePolicy();

    if (input.idempotencyKey) {
      const [existing] = await tx
        .select()
        .from(transactionCreditRequests)
        .where(
          and(
            eq(transactionCreditRequests.requesterId, actor.id),
            eq(
              transactionCreditRequests.idempotencyKey,
              input.idempotencyKey
            )
          )
        )
        .limit(1);

      if (existing) return existing as CreditRequest;
    }

    const [recipient] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, input.recipientUserId))
      .limit(1);
    if (!recipient) {
      throw new FinanceError(
        "VALIDATION_ERROR",
        "Le bénéficiaire est introuvable."
      );
    }

    const [wallet] = await tx
      .select({
        id: userWallets.id,
        userId: userWallets.userId,
        isActive: userWallets.isActive,
        isLocked: userWallets.isLocked,
      })
      .from(userWallets)
      .where(eq(userWallets.id, input.recipientWalletId))
      .limit(1);

    if (!wallet) {
      throw new FinanceError("ACCOUNT_NOT_FOUND", "Wallet introuvable.");
    }
    if (wallet.userId !== input.recipientUserId) {
      throw new FinanceError(
        "VALIDATION_ERROR",
        "Le wallet n'appartient pas au bénéficiaire."
      );
    }
    if (wallet.isActive === false) {
      throw new FinanceError("ACCOUNT_INACTIVE", "Wallet inactif.");
    }
    if (wallet.isLocked === true) {
      throw new FinanceError("ACCOUNT_LOCKED", "Wallet verrouillé.");
    }

    const requestedToday = await getRequestedToday(tx, actor.id);
    assertRequestWithinPolicy(
      input.amount,
      actor.level,
      requestedToday,
      policy
    );

    const [created] = await tx
      .insert(transactionCreditRequests)
      .values({
        requesterId: actor.id,
        requesterLevel: actor.level,
        recipientUserId: input.recipientUserId,
        recipientWalletId: input.recipientWalletId,
        amount: Number(input.amount).toFixed(2),
        currency: "GTC",
        reason,
        status: "PENDING",
        idempotencyKey: input.idempotencyKey ?? null,
        metadata: {
          requestedTodayBefore: requestedToday.toFixed(2),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await writeFinancialAuditLog(tx, {
      actorId: actor.id,
      actorLevel: actor.level,
      action: "CREDIT_REQUEST_CREATED",
      requestId: created.id,
      amount: created.amount,
      reason,
      metadata: {
        recipientUserId: input.recipientUserId,
        recipientWalletId: input.recipientWalletId,
      },
    });

    return created as CreditRequest;
  });
}

export interface ListCreditRequestsFilters {
  status?: CreditRequest["status"];
  requesterId?: string;
  limit?: number;
}

export async function listCreditRequests(
  filters: ListCreditRequestsFilters = {}
): Promise<CreditRequest[]> {
  const currentUser = await getCurrentUser();
  assertAuthenticated(currentUser);
  const actor = await loadAdminActor(db, currentUser.id);

  const conditions = [];
  if (filters.status) {
    conditions.push(eq(transactionCreditRequests.status, filters.status));
  }
  // Un admin C ne voit que ses propres demandes.
  if (actor.level === "C") {
    conditions.push(eq(transactionCreditRequests.requesterId, actor.id));
  } else if (filters.requesterId) {
    conditions.push(
      eq(transactionCreditRequests.requesterId, filters.requesterId)
    );
  }

  const query = db
    .select()
    .from(transactionCreditRequests)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`${transactionCreditRequests.createdAt} DESC`);

  const rows = await (filters.limit
    ? query.limit(Math.min(filters.limit, 200))
    : query.limit(100));

  return rows as CreditRequest[];
}

/**
 * Annulation par le demandeur, uniquement tant que la demande est PENDING.
 */
export async function cancelCreditRequest(
  requestId: string,
  reason?: string
): Promise<CreditRequest> {
  const currentUser = await getCurrentUser();
  assertAuthenticated(currentUser);

  return db.transaction(async (tx) => {
    const actor = await loadAdminActor(tx, currentUser.id);

    const [request] = await tx
      .select()
      .from(transactionCreditRequests)
      .where(eq(transactionCreditRequests.id, requestId))
      .for("update");

    if (!request) {
      throw new FinanceError(
        "TRANSACTION_NOT_FOUND",
        "Demande introuvable."
      );
    }
    if (request.requesterId !== actor.id) {
      throw new FinanceError(
        "FORBIDDEN",
        "Seul le demandeur peut annuler sa demande."
      );
    }
    if (request.status !== "PENDING") {
      throw new FinanceError(
        "INVALID_STATUS",
        "Seule une demande en attente peut être annulée."
      );
    }

    const [updated] = await tx
      .update(transactionCreditRequests)
      .set({
        status: "CANCELLED",
        decidedBy: actor.id,
        decidedAt: new Date(),
        rejectionReason: reason?.trim() || "Annulée par le demandeur",
        updatedAt: new Date(),
      })
      .where(eq(transactionCreditRequests.id, requestId))
      .returning();

    await writeFinancialAuditLog(tx, {
      actorId: actor.id,
      actorLevel: actor.level,
      action: "CREDIT_REQUEST_CANCELLED",
      requestId,
      amount: request.amount,
      reason: reason ?? "Annulation demandeur",
    });

    return updated as CreditRequest;
  });
}
