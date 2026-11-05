/**
 * lib/finance/audit/audit-log.ts
 *
 * Journal append-only des opérations financières sensibles.
 * Chaque opération doit être journalisée dans la même transaction SQL
 * que l'opération métier qu'elle décrit.
 */

import { db } from "@/lib/db";
import { financialAuditLogs, users } from "@/database/schema";
import { desc, eq, and } from "drizzle-orm";
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

export interface AuditLogFilters {
  action?: string;
  actorId?: string;
  limit?: number;
}

export interface AuditLogRow {
  id: string;
  actorId: string | null;
  actorUsername: string | null;
  actorLevel: AdminLevel | null;
  action: string;
  transactionId: string | null;
  requestId: string | null;
  accountId: string | null;
  amount: string | null;
  currency: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date | string;
}

export async function listFinancialAuditLogs(
  filters: AuditLogFilters = {}
): Promise<AuditLogRow[]> {
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);

  const conditions = [];
  if (filters.action) conditions.push(eq(financialAuditLogs.action, filters.action));
  if (filters.actorId) conditions.push(eq(financialAuditLogs.actorId, filters.actorId));

  const rows = await db
    .select({
      id: financialAuditLogs.id,
      actorId: financialAuditLogs.actorId,
      actorLevel: financialAuditLogs.actorLevel,
      action: financialAuditLogs.action,
      transactionId: financialAuditLogs.transactionId,
      requestId: financialAuditLogs.requestId,
      accountId: financialAuditLogs.accountId,
      amount: financialAuditLogs.amount,
      currency: financialAuditLogs.currency,
      reason: financialAuditLogs.reason,
      metadata: financialAuditLogs.metadata,
      createdAt: financialAuditLogs.createdAt,
      actorUsername: users.username,
    })
    .from(financialAuditLogs)
    .leftJoin(users, eq(users.id, financialAuditLogs.actorId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(financialAuditLogs.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    actorUsername: row.actorUsername ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt ?? new Date(),
  }));
}
