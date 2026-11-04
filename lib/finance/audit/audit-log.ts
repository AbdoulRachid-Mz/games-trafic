/**
 * lib/finance/audit/audit-log.ts
 *
 * Journal append-only des opérations financières sensibles.
 * Chaque opération doit être journalisée dans la même transaction SQL
 * que l'opération métier qu'elle décrit.
 */

import { db } from "@/lib/db";
import { financialAuditLogs } from "@/database/schema";
import type { AdminLevel } from "@/lib/auth/permissions";

type DbClient = typeof db | any;

export interface FinancialAuditEntry {
  actorId?: string | null;
  actorLevel?: AdminLevel | null;
  action: string;
  transactionId?: string | null;
  requestId?: string | null;
  accountId?: string | null;
  amount?: number | string | null;
  currency?: string;
  reason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

export async function writeFinancialAuditLog(
  client: DbClient,
  entry: FinancialAuditEntry
): Promise<void> {
  const amount =
    entry.amount === null || entry.amount === undefined
      ? null
      : Number(entry.amount).toFixed(2);

  await client.insert(financialAuditLogs).values({
    actorId: entry.actorId ?? null,
    actorLevel: entry.actorLevel ?? null,
    action: entry.action,
    transactionId: entry.transactionId ?? null,
    requestId: entry.requestId ?? null,
    accountId: entry.accountId ?? null,
    amount,
    currency: entry.currency ?? "GTC",
    reason: entry.reason ?? null,
    ip: entry.ip ?? null,
    userAgent: entry.userAgent ?? null,
    metadata: entry.metadata ?? {},
    createdAt: new Date(),
  });
}
