// @/utils/app-url.ts

/**
 * URL canonique de l'application.
 *
 * - Navigateur : on utilise toujours l'origine courante (localhost, preview
 *   Vercel, domaine de production…) pour rester cohérent avec la barre
 *   d'adresse et éviter toute erreur de résolution de domaine.
 * - Serveur en production : `APP_URL` (ou `NEXT_PUBLIC_APP_URL`) si défini,
 *   sinon le domaine de production officiel.
 * - Serveur en développement : toujours `localhost`, même si un fichier `.env`
 *   partagé contient une URL de production.
 */
export const PRODUCTION_APP_URL = "https://games-trafic.vercel.app";
export const DEVELOPMENT_APP_URL = "http://localhost:3000";

const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|\[::1\])$/i;

function normalizeAppUrl(value?: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (!url.hostname) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isLocalAppUrl(value: string): boolean {
  try {
    return LOCAL_HOST_PATTERN.test(new URL(value).hostname);
  } catch {
    return false;
  }
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Retourne l'URL de base de l'application, avec protocole et sans slash final.
 */
export function getAppUrlEnv(): string {
  // Côté client, l'origine réelle est la source de vérité.
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (isProductionRuntime()) {
    const candidates = [
      process.env.APP_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.BETTER_AUTH_URL,
      process.env.NEXTAUTH_URL,
    ];

    for (const candidate of candidates) {
      const normalized = normalizeAppUrl(candidate);
      // Une URL locale dans un environnement de production casserait
      // l'authentification et les callbacks : on l'ignore.
      if (normalized && !isLocalAppUrl(normalized)) {
        return normalized;
      }
    }

    return PRODUCTION_APP_URL;
  }

  // Développement local : jamais de domaine distant.
  const explicitLocalUrl = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
  ]
    .map(normalizeAppUrl)
    .find((url): url is string => !!url && isLocalAppUrl(url));

  return explicitLocalUrl ?? DEVELOPMENT_APP_URL;
}

/**
 * Hôte (sans port) utilisé notamment comme Relying Party ID WebAuthn.
 * En développement : `localhost`. En production : `games-trafic.vercel.app`.
 */
export function getAppHostEnv(): string {
  try {
    return new URL(getAppUrlEnv()).hostname;
  } catch {
    return isProductionRuntime() ? "games-trafic.vercel.app" : "localhost";
  }
}
