// @/actions/admin-finances.ts
"use server";

/**
 * actions/admin-finance.ts
 *
 * Façade serveur de l'administration financière V2 :
 * émissions GTC directes, demandes de crédit et décisions A/B/C.
 * Toute l'autorité (acteur, niveau, plafonds) est relue côté serveur par
 * les modules `lib/finance`.
 */

import { revalidatePath } from "next/cache";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/database/schema";
import {
  issueGtcDirect,
  type DirectIssuanceInput,
} from "@/lib/finance/transactions/issuance";
import {
  createCreditRequest,
  listCreditRequests,
  cancelCreditRequest,
  type CreateCreditRequestInput,
  type ListCreditRequestsFilters,
} from "@/lib/finance/requests/credit-requests";
import {
  approveCreditRequest,
  rejectCreditRequest,
} from "@/lib/finance/requests/approval";
import { listFinancialAuditLogs } from "@/lib/finance/audit/audit-log";

const refresh = () => {
  revalidatePath("/admin/finance");
  revalidatePath("/admin/transactions");
  revalidatePath("/wallet");
};

export async function adminIssueGtc(input: DirectIssuanceInput) {
  const result = await issueGtcDirect(input);
  refresh();
  return {
    success: true as const,
    transactionId: result.transaction.id,
    amount: Number(result.transaction.amount),
  };
}

export async function adminCreateCreditRequest(
  input: CreateCreditRequestInput
) {
  const request = await createCreditRequest(input);
  refresh();
  return request;
}

export async function adminListCreditRequests(
  filters: ListCreditRequestsFilters = {}
) {
  const rows = await listCreditRequests(filters);

  const ids = Array.from(
    new Set(rows.flatMap((row) => [row.requesterId, row.recipientUserId]))
  );

  const nameRows = ids.length
    ? await db
        .select({ id: users.id, username: users.username })
        .from(users)
        .where(inArray(users.id, ids))
    : [];

  const names = new Map(nameRows.map((row) => [row.id, row.username]));

  return rows.map((row) => ({
    ...row,
    requesterUsername: names.get(row.requesterId) ?? null,
    recipientUsername: names.get(row.recipientUserId) ?? null,
  }));
}

export async function adminApproveCreditRequest(requestId: string) {
  const result = await approveCreditRequest(requestId);
  refresh();
  return result;
}

export async function adminRejectCreditRequest(
  requestId: string,
  reason: string
) {
  const request = await rejectCreditRequest(requestId, reason);
  refresh();
  return request;
}

export async function adminCancelCreditRequest(
  requestId: string,
  reason?: string
) {
  const request = await cancelCreditRequest(requestId, reason);
  refresh();
  return request;
}

export async function adminListAuditLogs(filters?: {
  action?: string;
  actorId?: string;
  limit?: number;
}) {
  return listFinancialAuditLogs(filters ?? {});
}
