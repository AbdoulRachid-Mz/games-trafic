// lib/auth/session.ts - MISE À JOUR
import { auth } from "../auth";
import { headers, cookies } from "next/headers";

/**
 * Récupère la session côté serveur avec profil complet
 */
export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const session = await auth.api.getSession({
      headers: {
        cookie: cookieStore.toString(),
      },
    });

    return session;
  } catch (error) {
    console.error("Error getting server session:", error);
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
