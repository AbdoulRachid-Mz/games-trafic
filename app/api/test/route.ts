import { NextRequest, NextResponse } from "next/server";
import { APIKeyAuth } from "@/lib/api/auth/api-key-auth";
import { RateLimiter } from "@/lib/api/rate-limiter";
import { db } from "@/lib/db";
import { apiLogs } from "@/database/schema";

/**
 * Route de test pour l'authentification par clé API et le rate limiting
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Clé API manquante dans l'en-tête x-api-key" },
      { status: 401 }
    );
  }

  // 1. Valider la clé
  const authResult = await APIKeyAuth.validateKey(apiKey, {
    ip: req.headers.get("x-forwarded-for") || "unknown",
    origin: req.headers.get("origin") || undefined,
  });

  if (!authResult) {
    return NextResponse.json(
      { success: false, error: "Clé API invalide ou révoquée" },
      { status: 401 }
    );
  }

  // 2. Vérifier le Rate Limit Horaire
  const rateLimiter = RateLimiter.getInstance();
  const hourlyResult = await rateLimiter.check(`apikey:${authResult.id}`, {
    max: authResult.rateLimitPerHour || 1000,
    window: 3600000, // 1 heure
    keyPrefix: "api_test_h",
  });

  // 2. Vérifier le Rate Limit Journalier
  const dailyResult = await rateLimiter.check(`apikey:${authResult.id}`, {
    max: authResult.rateLimitPerDay || 10000,
    window: 24 * 3600000, // 24 heures
    keyPrefix: "api_test_d",
  });

  if (hourlyResult.limited || dailyResult.limited) {
    const limiter = hourlyResult.limited ? hourlyResult : dailyResult;
    const limit = hourlyResult.limited ? authResult.rateLimitPerHour : authResult.rateLimitPerDay;
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Limite de requêtes atteinte " + (hourlyResult.limited ? "(horaire)" : "(journalière)"),
        retryAfter: Math.ceil((limiter.reset - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          "Retry-After": Math.ceil((limiter.reset - Date.now()) / 1000).toString(),
          "X-RateLimit-Limit": (limit || 1000).toString(),
          "X-RateLimit-Remaining": limiter.remaining.toString(),
          "X-RateLimit-Reset": limiter.reset.toString(),
        }
      }
    );
  }

  // 3. Log de la requête (Asynchrone)
  const duration = Date.now() - startTime;
  void db.insert(apiLogs).values({
    userId: authResult.userId,
    apiKeyId: authResult.id,
    method: "GET",
    path: "/api/test",
    statusCode: 200,
    ip: req.headers.get("x-forwarded-for") || "unknown",
    userAgent: req.headers.get("user-agent"),
    duration,
  });

  // 4. Réponse
  return NextResponse.json({
    success: true,
    message: "Authentification réussie !",
    actor: {
      id: authResult.userId,
      name: authResult.user?.fullName,
      type: authResult.type,
      permissions: authResult.permissions,
    },
    rateLimit: {
      hourly: {
        limit: authResult.rateLimitPerHour,
        remaining: hourlyResult.remaining,
        reset: new Date(hourlyResult.reset).toISOString(),
      },
      daily: {
        limit: authResult.rateLimitPerDay,
        remaining: dailyResult.remaining,
        reset: new Date(dailyResult.reset).toISOString(),
      }
    },
    timestamp: new Date().toISOString(),
  });
}
