// lib/auth/session.ts - MISE À JOUR
import { auth } from "../auth";
import { headers } from "next/headers";

/**
 * Récupère la session côté serveur avec profil complet
 */
export async function getServerSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    return session;
  } catch (error) {
    console.error("Erreur lors de la récupération de la session:", error);
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
