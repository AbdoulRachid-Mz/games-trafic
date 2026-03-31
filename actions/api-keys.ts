"use server";

import { db } from "@/lib/db";
import { apiKeys, apiLogs, users } from "@/database/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { APIKeyAuth, GenerateKeyOptions } from "@/lib/api/auth/api-key-auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Liste toutes les clés API (pour l'admin)
 */
export async function listAllApiKeys() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      type: apiKeys.type,
      prefix: apiKeys.keyPrefix,
      userId: apiKeys.userId,
      userName: users.fullName,
      lastUsedAt: apiKeys.lastUsedAt,
      requestCount: apiKeys.requestCount,
      expiresAt: apiKeys.expiresAt,
      status: apiKeys.status,
      createdAt: apiKeys.createdAt,
      rateLimitPerHour: apiKeys.rateLimitPerHour,
      rateLimitPerDay: apiKeys.rateLimitPerDay,
    })
    .from(apiKeys)
    .leftJoin(users, eq(users.id, apiKeys.userId))
    .orderBy(desc(apiKeys.createdAt));
}

/**
 * Crée une nouvelle clé API
 */
export async function createApiKey(userId: string, options: GenerateKeyOptions) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const result = await APIKeyAuth.generateKey(userId, options);
  
  revalidatePath("/admin/api/keys");
  return result;
}

/**
 * Révoque une clé API
 */
export async function revokeApiKey(keyId: string, reason: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await APIKeyAuth.revokeKey(keyId, reason, session.user.id!);
  
  revalidatePath("/admin/api/keys");
  return { success: true };
}

/**
 * Récupère les logs API
 */
export async function getApiLogs(limit = 100) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return await db
    .select({
      id: apiLogs.id,
      method: apiLogs.method,
      path: apiLogs.path,
      statusCode: apiLogs.statusCode,
      duration: apiLogs.duration,
      ip: apiLogs.ip,
      createdAt: apiLogs.createdAt,
      userName: users.fullName,
      apiKeyName: apiKeys.name,
    })
    .from(apiLogs)
    .leftJoin(users, eq(users.id, apiLogs.userId))
    .leftJoin(apiKeys, eq(apiKeys.id, apiLogs.apiKeyId))
    .orderBy(desc(apiLogs.createdAt))
    .limit(limit);
}
