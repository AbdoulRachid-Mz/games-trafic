// @/actions/receipt.ts
import { db } from "@/lib/db";
import { receipts, walletTransactions, users } from '@/database/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// ============================================================================
// TYPES
// ============================================================================

const createReceiptSchema = z.object({
  transactionId: z.string().uuid(),
  receiptUrl: z.string().url(),
  receiptNumber: z.string(),
  title: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});


export async function createReceipt(
  input: z.infer<typeof createReceiptSchema>
) {
  const parsed = createReceiptSchema.parse(input);

  const [transaction] = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.id, parsed.transactionId))
    .limit(1);

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  const [newReceipt] = await db
    .insert(receipts)
    .values({
      transactionId: transaction.id,
      userId: transaction.fromUserId!,
      receiptNumber: parsed.receiptNumber,
      title: parsed.title,
      description: parsed.description,

      type: transaction.type,
      amount: transaction.amount,
      fees: transaction.fees,
      netAmount: transaction.netAmount,
      currency: transaction.currency,

      fileUrl: parsed.receiptUrl,
      metadata: parsed.metadata ?? {},
    })
    .returning();

  revalidatePath('/dashboard/receipts');
  return newReceipt;
}

// ============================================================================
// GET RECEIPT BY ID
// ============================================================================

export async function getReceiptById(id: string) {
  const [receipt] = await db
    .select({
      receipt: receipts,
      transaction: walletTransactions,
      user: users,
    })
    .from(receipts)
    .leftJoin(walletTransactions, eq(receipts.transactionId, walletTransactions.id))
    .leftJoin(users, eq(receipts.userId, users.id))
    .where(eq(receipts.id, id))
    .limit(1);

  if (!receipt) {
    throw new Error('Receipt not found');
  }

  return receipt;
}

// ============================================================================
// GET RECEIPTS BY USER ID
// ============================================================================

export async function getReceiptsByUserId(userId: string, limit = 50, offset = 0) {
  const results = await db
    .select({
      receipt: receipts,
      transaction: walletTransactions,
      user: users,
    })
    .from(receipts)
    .leftJoin(walletTransactions, eq(receipts.transactionId, walletTransactions.id))
    .leftJoin(users, eq(receipts.userId, users.id))
    .where(eq(receipts.userId, userId))
    .orderBy(desc(receipts.createdAt))
    .limit(limit)
    .offset(offset);

  return results;
}

// ============================================================================
// GET RECEIPTS BY TRANSACTION ID
// ============================================================================

export async function getReceiptsByTransactionId(transactionId: string) {
  const results = await db
    .select({
      receipt: receipts,
      transaction: walletTransactions,
      user: users,
    })
    .from(receipts)
    .leftJoin(walletTransactions, eq(receipts.transactionId, walletTransactions.id))
    .leftJoin(users, eq(receipts.userId, users.id))
    .where(eq(receipts.transactionId, transactionId))
    .orderBy(desc(receipts.createdAt));

  return results;
}

// ============================================================================
// UPDATE RECEIPT METADATA
// ============================================================================

const updateReceiptMetadataSchema = z.object({
  id: z.string().uuid(),
  metadata: z.record(z.string(), z.unknown()),
});

export async function updateReceiptMetadata(input: z.infer<typeof updateReceiptMetadataSchema>) {
  const parsed = updateReceiptMetadataSchema.parse(input);

  const [updated] = await db
    .update(receipts)
    .set({ metadata: parsed.metadata, updatedAt: new Date() })
    .where(eq(receipts.id, parsed.id))
    .returning();

  if (!updated) {
    throw new Error('Receipt not found');
  }

  revalidatePath(`/dashboard/receipts`);
  return updated;
}

// ============================================================================
// DELETE RECEIPT
// ============================================================================

export async function deleteReceipt(id: string) {
  const [deleted] = await db
    .delete(receipts)
    .where(eq(receipts.id, id))
    .returning();

  if (!deleted) {
    throw new Error('Receipt not found');
  }

  revalidatePath(`/dashboard/receipts`);
  return deleted;
}

// ============================================================================
// GENERATE RECEIPT NUMBER
// ============================================================================

export function generateReceiptNumber(): string {
  const prefix = 'RCP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
