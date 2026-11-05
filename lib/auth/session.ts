"use server";
// lib/auth/session.ts
import { auth } from "../auth";
import { headers } from "next/headers";

const isPrerenderError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const message = String((error as { message?: unknown }).message ?? error);
  return (
    message.includes("prerender") ||
    message.includes("headers()") ||
    message.includes("HANGING_PROMISE_REJECTION") ||
    message.includes("Dynamic server usage")
  );
};

/**
 * Récupère la session côté serveur avec profil complet.
 * Pendant le prerendering (Next.js), `headers()` rejette : on renvoie
 * alors `null` silencieusement au lieu de spammer les logs.
 */
export async function getServerSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    if (!isPrerenderError(error)) {
      console.error("Erreur lors de la récupération de la session:", error);
    }
    return null;
  }
}

export async function getServerSession2(headersObj: Headers) {
  try {
    const session = await auth.api.getSession({
      headers: headersObj,
    });
    return session;
  } catch (error) {
    if (!isPrerenderError(error)) {
      console.error("Erreur session:", error);
    }
    return null;
  }
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession();
  return !!session?.user;
}

/**
 * Récupère l'utilisateur actuel côté serveur avec profil complet
 */
export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user || null;
}

export async function getCurrentUser2(headersObj: Headers) {
  const session = await getServerSession2(headersObj);
  return session?.user || null;
}