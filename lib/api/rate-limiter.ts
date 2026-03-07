//@/lib/api/rate-limiter.ts
import { Redis } from 'ioredis';
import { db } from '@/lib/db';
import { apiRateLimits } from '@/database/schema';
import { sql, and, eq, lt } from 'drizzle-orm';
import { createHash } from 'node:crypto';

export interface RateLimitConfig {
  max: number;
  window: number; // ms
  keyPrefix: string;
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  reset: number;
  total: number;
}

export class RateLimiter {
  private redis: Redis | null = null;
  private static instance: RateLimiter;
  private useRedis: boolean = false;

  private constructor() {
    // Initialiser Redis uniquement si l'URL est configurée
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy: (times) => {
            if (times > 3) return null; // Arrêter après 3 tentatives
            return Math.min(times * 100, 1000);
          },
        });
        this.useRedis = true;
      } catch (error) {
        console.warn('Redis non disponible, fallback sur PostgreSQL');
      }
    }
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  async check(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    // Essayer Redis si disponible
    if (this.useRedis && this.redis) {
      try {
        return await this.checkRedis(identifier, config);
      } catch (error) {
        console.warn('Redis check failed, falling back to PostgreSQL:', error);
        this.useRedis = false; // Désactiver Redis temporairement
      }
    }

    // Fallback PostgreSQL
    return await this.checkDatabase(identifier, config);
  }

  private async checkRedis(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const key = `${config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.window;

    const multi = this.redis!.multi();
    
    // Nettoyer les entrées anciennes
    multi.zremrangebyscore(key, 0, windowStart);
    
    // Ajouter la requête actuelle
    multi.zadd(key, now, `${now}-${Math.random()}`);
    
    // Compter les requêtes
    multi.zcard(key);
    
    // Définir l'expiration
    multi.expire(key, Math.ceil(config.window / 1000));
    
    const results = await multi.exec();
    const count = (results?.[2]?.[1] as number) || 0;
    
    const remaining = Math.max(0, config.max - count);
    const reset = windowStart + config.window;

    return {
      limited: count > config.max,
      remaining,
      reset,
      total: count,
    };
  }

  private async checkDatabase(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = new Date(now - config.window);
    const windowKey = `${identifier}:${Math.floor(now / config.window)}`;

    // Utiliser une transaction pour éviter les race conditions
    return await db.transaction(async (tx) => {
      // Nettoyer les anciennes entrées
      await tx
        .delete(apiRateLimits)
        .where(lt(apiRateLimits.createdAt, windowStart));

      // Compter les requêtes dans la fenêtre
      const [countResult] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(apiRateLimits)
        .where(
          and(
            eq(apiRateLimits.identifier, identifier),
            eq(apiRateLimits.windowKey, windowKey)
          )
        );

      const count = countResult?.count || 0;

      if (count < config.max) {
        // Enregistrer la requête
        await tx.insert(apiRateLimits).values({
          identifier,
          windowKey,
          expiresAt: new Date(now + config.window),
        });
      }

      return {
        limited: count >= config.max,
        remaining: Math.max(0, config.max - count),
        reset: windowStart.getTime() + config.window,
        total: count,
      };
    });
  }

  /**
   * Middleware pour vérifier le rate limit
   */
  async middleware(
    req: Request,
    config: RateLimitConfig
  ): Promise<Response | null> {
    const identifier = this.getIdentifier(req);
    const result = await this.check(identifier, config);

    if (result.limited) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Trop de requêtes, veuillez réessayer plus tard',
            reset: result.reset,
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': config.max.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
          },
        }
      );
    }

    return null;
  }

  private getIdentifier(request: Request): string {
    // Priorité: API Key > IP
    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
      const keyHash = createHash("sha256").update(apiKey).digest("hex");
      return `apikey:${keyHash}`;
    }

    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    return `ip:${ip}`;
  }
}