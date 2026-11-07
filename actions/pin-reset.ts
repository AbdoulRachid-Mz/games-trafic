"use server";

import { db } from "@/lib/db";
import { pinResetRequests, userWallets } from "@/database/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { WalletUtils } from "@/lib/wallet/wallet-utils";
import { createNotification } from "@/actions/notifications";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { createHash, randomInt } from "node:crypto";

const CODE_TTL_MS = 10 * 60 * 1000; // Code valable 10 minutes
const TOKEN_TTL_MS = 10 * 60 * 1000; // Jeton post-vérification valable 10 minutes
const MAX_ATTEMPTS = 5; // Max tentatives de vérification du code
const RESEND_COOLDOWN_MS = 2 * 60 * 1000; // 2 min entre deux demandes
const MAX_OPEN_REQUESTS = 3; // Max demandes actives simultanées

function hashCode(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function hashBcrypt(value: string): Promise<string> {
  return bcrypt.hash(value, 10);
}

/**
 * Étape 1 — Demande d'un code de réinitialisation à 6 chiffres.
 * Le code est délivré via notification in-app (aucun fournisseur email/SMS n'est configuré).
 */
export async function requestPinResetCode(walletId: string): Promise<{
  success: boolean;
  requestId?: string;
  cooldownSeconds?: number;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Non authentifié" };
    }

    const [wallet] = await db
      .select()
      .from(userWallets)
      .where(eq(userWallets.id, walletId))
      .limit(1);
    if (!wallet || wallet.userId !== user.id) {
      return { success: false, error: "Wallet introuvable" };
    }

    // Anti-spam : cooldown sur la dernière demande + demandes ouvertes
    const [lastRequest] = await db
      .select()
      .from(pinResetRequests)
      .where(eq(pinResetRequests.userId, user.id))
      .orderBy(desc(pinResetRequests.createdAt))
      .limit(1);

    if (lastRequest && !lastRequest.consumedAt) {
      const elapsed = Date.now() - new Date(lastRequest.createdAt || 0).getTime();
      if (elapsed >= 0 && elapsed < RESEND_COOLDOWN_MS) {
        const remaining = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return {
          success: false,
          cooldownSeconds: remaining,
          error: `Veuillez patienter ${remaining}s avant de redemander un code`,
        };
      }
    }

    const openRequests = await db
      .select()
      .from(pinResetRequests)
      .where(
        and(
          eq(pinResetRequests.userId, user.id),
          isNull(pinResetRequests.consumedAt)
        )
      );
    if (openRequests.length >= MAX_OPEN_REQUESTS) {
      return {
        success: false,
        error: "Trop de demandes en cours. Utilisez le code déjà reçu.",
      };
    }

    const code = randomInt(100000, 1000000).toString(); // 6 chiffres
    const codeHash = await hashBcrypt(code);
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    await db.insert(pinResetRequests).values({
      userId: user.id,
      walletId,
      codeHash,
      expiresAt,
    });

    // Livraison : notification in-app (le canal email/WhatsApp sera branché plus tard)
    await createNotification({
      userId: user.id,
      title: "Réinitialisation du PIN",
      message: `Votre code de réinitialisation de PIN est : ${code}. Il expire dans 10 minutes. Ne le partagez avec personne.`,
      type: "SECURITY",
      linkUrl: "/wallet/settings?action=recover-pin",
    });

    return { success: true, requestId: "ok" };
  } catch (error) {
    console.error("requestPinResetCode error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur serveur",
    };
  }
}

/**
 * Étape 2 — Vérification du code OTP. Retourne un jeton à usage unique
 * permettant de définir le nouveau PIN (étape 3).
 */
export async function verifyPinResetCode(params: {
  walletId: string;
  code: string;
}): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Non authentifié" };
    }

    const [request] = await db
      .select()
      .from(pinResetRequests)
      .where(
        and(
          eq(pinResetRequests.userId, user.id),
          eq(pinResetRequests.walletId, params.walletId),
          isNull(pinResetRequests.consumedAt)
        )
      )
      .orderBy(desc(pinResetRequests.createdAt))
      .limit(1)
      .for("update");

    if (!request) {
      return { success: false, error: "Aucun code à vérifier" };
    }
    if (new Date(request.expiresAt) < new Date()) {
      return { success: false, error: "Code expiré, demandez-en un nouveau" };
    }
    if ((request.attempts || 0) >= MAX_ATTEMPTS) {
      return {
        success: false,
        error: "Trop de tentatives. Demandez un nouveau code.",
      };
    }
    if (!/^\d{4,8}$/.test(params.code)) {
      return { success: false, error: "Format de code invalide" };
    }

    const isValid = await bcrypt.compare(params.code, request.codeHash);
    if (!isValid) {
      await db
        .update(pinResetRequests)
        .set({ attempts: (request.attempts || 0) + 1 })
        .where(eq(pinResetRequests.id, request.id));
      return {
        success: false,
        error: `Code incorrect (${MAX_ATTEMPTS - (request.attempts || 0) - 1} tentatives restantes)`,
      };
    }

    // Jeton à usage unique, hashé (sha256, longueur aléatoire suffisante)
    const token =
      Math.random().toString(36).slice(2) +
      createHash("sha256")
        .update(`${user.id}:${Date.now()}:${params.walletId}:${Math.random()}`)
        .digest("hex");

    await db
      .update(pinResetRequests)
      .set({
        tokenHash: hashCode(token),
        tokenExpiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        attempts: (request.attempts || 0) + 1,
      })
      .where(eq(pinResetRequests.id, request.id));

    return { success: true, token };
  } catch (error) {
    console.error("verifyPinResetCode error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur serveur",
    };
  }
}

/**
 * Étape 3 — Définition du nouveau PIN à l'aide du jeton de vérification.
 */
export async function resetPinWithToken(params: {
  walletId: string;
  token: string;
  newPin: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Non authentifié" };
    }
    if (typeof params.token !== "string" || params.token.length < 16) {
      return { success: false, error: "Jeton invalide" };
    }

    const validation = WalletUtils.validatePinStrength(params.newPin);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(", ") };
    }

    const [request] = await db
      .select()
      .from(pinResetRequests)
      .where(
        and(
          eq(pinResetRequests.userId, user.id),
          eq(pinResetRequests.walletId, params.walletId),
          isNull(pinResetRequests.consumedAt)
        )
      )
      .orderBy(desc(pinResetRequests.createdAt))
      .limit(1)
      .for("update");

    if (
      !request ||
      !request.tokenHash ||
      request.tokenHash !== hashCode(params.token)
    ) {
      return { success: false, error: "Jeton invalide ou expiré" };
    }
    if (new Date(request.tokenExpiresAt || 0) < new Date()) {
      return { success: false, error: "Jeton expiré, recommencez la vérification" };
    }

    // Code jamais consommé tant que le PIN n'est pas réellement changé :
    // on consomme ici (atomique : seul le premier appel gagne).
    const pinHash = await WalletUtils.hashPin(params.newPin);

    const [updatedWallet] = await db
      .update(userWallets)
      .set({
        pinHash,
        failedAttempts: 0,
        updatedAt: new Date(),
      })
      .where(and(eq(userWallets.id, params.walletId), eq(userWallets.userId, user.id)))
      .returning();

    if (!updatedWallet) {
      return { success: false, error: "Wallet introuvable" };
    }

    const consumed = await db
      .update(pinResetRequests)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(pinResetRequests.id, request.id),
          isNull(pinResetRequests.consumedAt)
        )
      )
      .returning({ id: pinResetRequests.id });

    if (consumed.length === 0) {
      return { success: false, error: "Code déjà consommé" };
    }

    // Toutes les autres demandes ouvertes de l'utilisateur sont invalidées.
    await db
      .update(pinResetRequests)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(pinResetRequests.userId, user.id),
          isNull(pinResetRequests.consumedAt)
        )
      );

    await createNotification({
      userId: user.id,
      title: "PIN modifié",
      message: "Votre PIN de wallet a été modifié avec succès. Si vous n'êtes pas à l'origine de cette action, contactez immédiatement le support.",
      type: "SECURITY",
    });

    revalidatePath("/wallet/settings");
    return { success: true };
  } catch (error) {
    console.error("resetPinWithToken error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur serveur",
    };
  }
}
