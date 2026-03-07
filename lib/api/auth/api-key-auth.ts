//@/lib/api/auth/api-key-auth.ts
import { db } from '@/lib/db';
import { apiKeys, users } from '@/database/schema';
import { eq, and, gt } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';

export interface APIKeyAuthResult {
  authenticated: boolean;
  user?: typeof users.$inferSelect;
  apiKey?: typeof apiKeys.$inferSelect;
  error?: string;
}

export interface GenerateKeyOptions {
  type: 'USER' | 'APPLICATION' | 'SERVICE';
  name?: string;
  applicationName?: string;
  permissions?: string[];
  expiresIn?: number; // ms
  allowedIps?: string[];
  allowedOrigins?: string[];
}

export class APIKeyAuth {
  private static readonly KEY_PREFIX = 'gt';
  private static readonly KEY_LENGTH = 32;

  /**
   * Génère une nouvelle clé API
   */
  static async generateKey(
    userId: string,
    options: GenerateKeyOptions
  ) {
    // Générer la clé brute
    const rawKey = randomBytes(this.KEY_LENGTH).toString('hex');
    const prefix = `${this.KEY_PREFIX}_${options.type.toLowerCase()}_`;
    const key = `${prefix}${rawKey}`;
    
    // Hacher la clé avec SHA256 (plus rapide que bcrypt)
    const hash = createHash('sha256').update(key).digest('hex');
    
    // Calculer l'expiration
    const expiresAt = options.expiresIn 
      ? new Date(Date.now() + options.expiresIn)
      : null;

    // Créer la clé en base
    const [apiKey] = await db.insert(apiKeys).values({
      userId,
      hash,
      keyPrefix: prefix,
      type: options.type,
      name: options.name,
      applicationName: options.applicationName,
      permissions: options.permissions || [],
      allowedIps: options.allowedIps || [],
      allowedOrigins: options.allowedOrigins || [],
      expiresAt,
      status: 'ACTIVE',
    }).returning();

    return {
      ...apiKey,
      key, // Retourner la clé brute UNE SEULE fois
    };
  }

  /**
   * Valide une clé API (utilisé par le handler)
   */

  static async validateKey(key: string, context: { ip?: string; origin?: string }) {
    // Extract prefix from key to enable partition key lookup and protect against timing attacks
    const underscoreIndex = key.indexOf('_', 3); // "gt_TYPE_"
    if (underscoreIndex === -1) return null;
    const prefix = key.slice(0, underscoreIndex + 1); // "gt_user_" | "gt_app_" | "gt_service_"

    const hash = createHash('sha256').update(key).digest('hex');

    const [row] = await db
      .select({
        apiKey: apiKeys,
        user: users,
      })
      .from(apiKeys)
      .leftJoin(users, eq(users.id, apiKeys.userId))
      .where(
        and(
          eq(apiKeys.keyPrefix, prefix),
          eq(apiKeys.hash, hash),
          eq(apiKeys.status, 'ACTIVE'),
          apiKeys.expiresAt ? gt(apiKeys.expiresAt, new Date()) : undefined
        )
      )
      .limit(1);

    if (!row || !row.apiKey) return null;

    const { apiKey, user } = row;

    // IP check
    if (apiKey.allowedIps?.length && context.ip) {
      if (!apiKey.allowedIps.includes(context.ip)) {
        return null;
      }
    }

    // Origin check
    if (apiKey.allowedOrigins?.length && context.origin) {
      const allowed = apiKey.allowedOrigins.some(o => context.origin?.startsWith(o));
      if (!allowed) return null;
    }

    if (!user || !user.isActive || user.isDeleted) return null;

    // Update last used asynchronously
    void db
      .update(apiKeys)
      .set({
        lastUsedAt: new Date(),
        lastUsedIp: context.ip,
        requestCount: sql`${apiKeys.requestCount} + 1`,
      })
      .where(eq(apiKeys.id, apiKey.id));

    return { ...apiKey, user };
  }

  /**
   * Liste les clés d'un utilisateur
   */
  static async listUserKeys(userId: string) {
    return await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        type: apiKeys.type,
        prefix: apiKeys.keyPrefix,
        permissions: apiKeys.permissions,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        status: apiKeys.status,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(apiKeys.createdAt);
  }

  /**
   * Révoque une clé API
   */
  static async revokeKey(keyId: string, reason: string, revokedBy: string) {
    await db
      .update(apiKeys)
      .set({
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedReason: reason,
        revokedBy,
      })
      .where(eq(apiKeys.id, keyId));
  }
}

import { sql } from 'drizzle-orm';