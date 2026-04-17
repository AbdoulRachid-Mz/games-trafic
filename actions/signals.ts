"use server";

// @/actions/signals.ts
import { signals } from "@/database/schema";
import { db } from "@/lib/db";
import { CreateSignalInput, SignalFilters, SignalStatus, SignalType, UpdateSignalInput } from "@/types/api";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";


// Create a new signal
export async function createSignal(input: CreateSignalInput) {
  if (!input.title || input.title.length < 5) {
    throw new Error("Titre invalide");
  }

  const now = new Date();

  const reporterCondition = input.userId
    ? eq(signals.reporterId, input.userId)
    : sql`${signals.reporterId} IS NULL`;

  const recentSignals = await db
    .select()
    .from(signals)
    .where(
      and(
        reporterCondition,
        sql`${signals.createdAt} > NOW() - INTERVAL '1 hour'`,
      ),
    );

  if (recentSignals.length >= 5) {
    throw new Error("Trop de signalements, réessayez plus tard");
  }

  const [signal] = await db
    .insert(signals)
    .values({
      reporterId: input.userId || null,
      targetId: input.targetId,
      targetType: input.targetType,

      title: input.title,
      description: input.description || "",

      severity: input.severity || "MEDIUM",
      metadata: input.metadata || {},

      status: "OPEN",

      createdAt: now,
      updatedAt: now,
    })
    .returning();

  revalidatePath(`/signals`);

  return signal;
}

// Get signal by ID
export async function getSignalById(id: string) {
  const [signal] = await db.select().from(signals).where(eq(signals.id, id));
  return signal || null;
}

// Get signals with filters
export async function getSignals(filters: SignalFilters = {}) {
  const {
    userId,
    type,
    status,
    limit = 20,
    offset = 0,
    orderBy = "createdAt",
    order = "desc",
  } = filters;

  const conditions = [eq(signals.isDeleted, false)];

  if (userId) conditions.push(eq(signals.reporterId, userId));
  if (type) conditions.push(eq(signals.targetType, type));
  if (status) conditions.push(eq(signals.status, status));

  const whereClause = and(...conditions);

  const data = await db
    .select()
    .from(signals)
    .where(whereClause)
    .orderBy(order === "desc" ? desc(signals[orderBy]) : asc(signals[orderBy]))
    .limit(limit)
    .offset(offset);

  // 🔥 total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(signals)
    .where(whereClause);

  return {
    data,
    pagination: {
      total: count,
      limit,
      offset,
    },
  };
}

// Update signal
export async function updateSignal(id: string, input: UpdateSignalInput) {
  const [updated] = await db
    .update(signals)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(signals.id, id))
    .returning();

  revalidatePath(`/signals/${id}`);

  return updated;
}

// Delete signal (soft delete)
export async function deleteSignal(id: string) {
  const [deleted] = await db
    .update(signals)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(eq(signals.id, id))
    .returning();
  revalidatePath(`/signals`);
  return deleted;
}

// Mark signal as processed
export async function markSignalAsProcessed(id: string) {
  const [updated] = await db
    .update(signals)
    .set({ status: "PROCESSED", updatedAt: new Date() })
    .where(eq(signals.id, id))
    .returning();
  revalidatePath(`/signals/${id}`);
  return updated;
}

// Get signals count by status
export async function getSignalsCountByStatus(userId?: string) {
  let query = db
    .select({
      status: signals.status,
      count: sql<number>`count(*)::int`,
    })
    .from(signals)
    .where(eq(signals.isDeleted, false))
    .groupBy(signals.status);

  if (userId) {
    query = db
      .select({
        status: signals.status,
        count: sql<number>`count(*)::int`,
      })
      .from(signals)
      .where(and(eq(signals.isDeleted, false), eq(signals.reporterId, userId)))
      .groupBy(signals.status);
  }

  return await query;
}

// Clean old processed signals (older than 30 days)
export async function cleanOldProcessedSignals() {
  const result = await db
    .update(signals)
    .set({ isDeleted: true })
    .where(
      and(
        eq(signals.status, "PROCESSED"),
        sql`${signals.updatedAt} < NOW() - INTERVAL '30 days'`,
      ),
    );

  return result.count;
}

export async function assignSignal(id: string, adminId: string) {
  const [updated] = await db
    .update(signals)
    .set({
      assignedTo: adminId,
      status: "IN_PROGRESS",
      updatedAt: new Date(),
    })
    .where(eq(signals.id, id))
    .returning();

  return updated;
}
