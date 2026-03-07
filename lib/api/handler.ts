//@/lib/api/handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { apiKeys, apiLogs, users } from '@/database/schema';
import { eq, and, gt } from 'drizzle-orm';
import { createHash } from 'crypto';
import { RateLimiter } from './rate-limiter';
import { AccessControl } from './access-control';

export interface HandlerConfig {
  // Authentification
  auth?: {
    required?: boolean;     // true par défaut
    allowSession?: boolean;  // true
    allowApiKey?: boolean;   // true
  };

  // Permissions
  permissions?: string[];    // ex: ["user:read", "product:create"]

  // Rate limiting
  rateLimit?: {
    max: number;             // max requêtes
    window: number;          // fenêtre en ms
  };

  // Validation
  schema?: z.ZodSchema;

  // Audit
  audit?: boolean;

  // Cache (optionnel)
  cache?: {
    ttl: number;             // durée en ms
  };
}

export interface HandlerContext {
  user?: typeof users.$inferSelect;
  apiKey?: typeof apiKeys.$inferSelect;
  params?: Record<string, string>;
  body?: any;
}

export class APIHandler {
  private static rateLimiter = RateLimiter.getInstance();

  static create<T>(
    handler: (req: NextRequest, ctx: HandlerContext) => Promise<T>,
    config: HandlerConfig = {}
  ) {
    return async (req: NextRequest, { params }: { params?: Record<string, string> } = {}) => {
      const startTime = Date.now();
      let auth: { authenticated: boolean; user?: any; apiKey?: any; error?: string } =
        { authenticated: false };

      try {
        // 1. Rate limiting
        if (config.rateLimit) {
          const identifier = this.getRateLimitIdentifier(req);
          const rateLimitResult = await this.rateLimiter.check(identifier, {
            max: config.rateLimit.max,
            window: config.rateLimit.window,
            keyPrefix: 'api'
          });

          // Ajouter les headers rate limit
          const headers = new Headers();
          headers.set('X-RateLimit-Limit', config.rateLimit.max.toString());
          headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
          headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());

          if (rateLimitResult.limited) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  message: 'Trop de requêtes, veuillez réessayer plus tard',
                  reset: rateLimitResult.reset,
                },
              },
              {
                status: 429,
                headers: {
                  'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
                  ...Object.fromEntries(headers),
                },
              }
            );
          }
        }

        // 2. Authentification
        auth = await this.authenticate(req, config.auth);

        if (config.auth?.required !== false && !auth.authenticated) {
          return this.errorResponse(401, 'UNAUTHORIZED', auth.error || 'Non authentifié');
        }

        // 3. Permissions
        // Dans handler.ts, ligne ~80
        if (config.permissions?.length && auth.user) {
          const hasPermissions = await AccessControl.hasAllPermissions(
            auth.user, // ← on passe l'user complet, pas seulement l'id
            config.permissions,
            {
              user: auth.user,
              resourceId: params?.id
            }
          );

          if (!hasPermissions.granted) {
            return this.errorResponse(403, 'FORBIDDEN', hasPermissions.reason || 'Permissions insuffisantes');
          }
        }

        if (auth.apiKey && config.permissions) {
          const allowed = config.permissions.every(p =>
            auth.apiKey.permissions.includes(p)
          );
          if (!allowed) {
            return this.errorResponse(403, 'FORBIDDEN', 'Permissions insuffisantes');
          }
        }


        // 4. Validation des données
        let body = undefined;
        if (config.schema) {
          try {
            // Ne parser le body que pour les méthodes qui en ont
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
              body = await req.json().catch(() => ({}));
            }
            body = config.schema.parse(body || {});
          } catch (error) {
            if (error instanceof z.ZodError) {
              return this.errorResponse(400, 'VALIDATION_ERROR', 'Données invalides', {
                errors: error.issues.map(e => ({
                  path: e.path.join('.'),
                  message: e.message,
                })),
              });
            }
          }
        }

        // 5. Exécution du handler
        const result = await handler(req, {
          user: auth.user,
          apiKey: auth.apiKey,
          params,
          body,
        });

        // 6. Audit (asynchrone)
        if (config.audit) {
          void this.logAudit(req, auth, 200, startTime);
        }

        return NextResponse.json({ success: true, data: result });

      } catch (error) {
        console.error('API Error:', error);

        // Log l'erreur
        if (config.audit) {
          void this.logAudit(req, auth, 500, startTime, error);
        }

        return this.errorResponse(500, 'INTERNAL_ERROR', 'Erreur serveur');
      }
    };
  }

  private static async authenticate(req: NextRequest, config: HandlerConfig['auth'] = {}) {
    const allowSession = config.allowSession ?? true;
    const allowApiKey = config.allowApiKey ?? true;

    // 1. API Key (prioritaire car plus rapide)
    if (allowApiKey) {
      const apiKey = req.headers.get('x-api-key');
      if (apiKey) {
        const key = await this.validateApiKey(apiKey, {
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
          origin: req.headers.get('origin') || '',
        });
        if (key) {
          return { authenticated: true, user: key.user, apiKey: key };
        }
      }
    }

    // 2. Session (pour le web)
    if (allowSession) {
      const session = await getServerSession();
      if (session?.user) {
        return { authenticated: true, user: session.user };
      }
    }

    return { authenticated: false, error: 'Authentification requise' };
  }

  private static async validateApiKey(key: string, context: { ip?: string; origin?: string }) {
    const hash = createHash('sha256').update(key).digest('hex');

    const [apiKey] = await db
      .select({
        id: apiKeys.id,
        userId: apiKeys.userId,
        permissions: apiKeys.permissions,
        allowedIps: apiKeys.allowedIps,
        allowedOrigins: apiKeys.allowedOrigins,
      })
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.hash, hash),
          eq(apiKeys.status, 'ACTIVE'),
          apiKeys.expiresAt ? gt(apiKeys.expiresAt, new Date()) : undefined
        )
      )
      .limit(1);

    if (!apiKey) return null;

    // Vérifications IP/Origin
    if (apiKey.allowedIps?.length && context.ip && !apiKey.allowedIps.includes(context.ip)) {
      return null;
    }

    if (apiKey.allowedOrigins?.length && context.origin) {
      const allowed = apiKey.allowedOrigins.some(o => context.origin?.startsWith(o));
      if (!allowed) return null;
    }

    // Récupérer l'utilisateur
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, apiKey.userId))
      .limit(1);

    if (!user || !user.isActive || user.isDeleted) return null;

    // Mettre à jour last used (asynchrone, on ne bloque pas)
    void db
      .update(apiKeys)
      .set({ lastUsedAt: new Date(), lastUsedIp: context.ip })
      .where(eq(apiKeys.id, apiKey.id));

    return { ...apiKey, user };
  }

  private static getRateLimitIdentifier(req: NextRequest): string {
    // Priorité: API Key > User ID (si session) > IP
    const apiKey = req.headers.get('x-api-key');
    if (apiKey) return `apikey:${apiKey}`;

    // Note: Pour les sessions, on pourrait avoir le userId après auth
    // Mais on rate limite avant auth, donc on utilise IP par défaut

    const ip = req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';
    return `ip:${ip}`;
  }

  private static logAudit(req: NextRequest, auth: any, status: number, startTime: number, error?: any) {
    const duration = Date.now() - startTime;

    setImmediate(async () => {
      try {
        await db.insert(apiLogs).values({
          userId: auth.user?.id,
          apiKeyId: auth.apiKey?.id,
          method: req.method,
          path: req.nextUrl.pathname,
          query: Object.fromEntries(req.nextUrl.searchParams),
          statusCode: status,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          userAgent: req.headers.get('user-agent'),
          duration,
          errorCode: error?.code,
          errorMessage: error?.message,
        });
      } catch (err) {
        console.error('Audit log error:', err);
      }
    });
  }

  private static errorResponse(status: number, code: string, message: string, details?: any) {
    return NextResponse.json(
      { success: false, error: { code, message, ...details } },
      { status }
    );
  }

  // static async executePipeline(req, config) {

  //   await this.rateLimiter(req)
  //   await this.authenticate(req, config.auth)
  //   await this.checkPermissions(req, config.permissions)
  //   await this.validateSchema(req, config.schema)

  // }
}