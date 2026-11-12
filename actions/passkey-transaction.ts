"use server";

import { db } from "@/lib/db";
import { passkey, passkeyTransactionChallenges, userWallets } from "@/database/schema";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
import { createHash, randomBytes } from "node:crypto";
import { getAppHostEnv, getAppUrlEnv } from "@/utils/app-url";

// Passkey transaction challenge.
// RP_ID/ORIGIN sont dérivés du contexte d'exécution :
// - développement : localhost
// - production : games-trafic.vercel.app
const RP_ID = getAppHostEnv();
const ORIGIN = getAppUrlEnv();
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export interface PasskeyChallengeParams {
  walletId: string;
  transactionType: string;
  amount: number;
  recipientId?: string | null;
  fees: number;
}

function computeTransactionHash(params: PasskeyChallengeParams): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        walletId: params.walletId,
        type: params.transactionType,
        amount: params.amount,
        recipientId: params.recipientId ?? null,
        fees: params.fees,
      })
    )
    .digest("hex");
}

export async function requestPasskeyChallenge(
  params: PasskeyChallengeParams
): Promise<{
  success: boolean;
  challengeId?: string;
  options?: unknown;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return { success: false, error: "Non authentifié" };
    }

    const [wallet] = await db
      .select()
      .from(userWallets)
      .where(eq(userWallets.id, params.walletId))
      .limit(1);

    if (!wallet || wallet.userId !== user.id) {
      return { success: false, error: "Wallet introuvable" };
    }

    const credentials = await db
      .select()
      .from(passkey)
      .where(eq(passkey.userId, user.id));

    if (credentials.length === 0) {
      return { success: false, error: "Aucun Passkey enregistré" };
    }

    const allowCredentials = credentials.map((cred) => ({
      id: cred.credentialID,
      transports: cred.transports
        ? (cred.transports.split(",") as AuthenticatorTransportFuture[])
        : undefined,
    }));

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials,
      userVerification: "preferred",
    });

    const challengeId = randomBytes(16).toString("hex");
    const transactionHash = computeTransactionHash(params);
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);

    await db.insert(passkeyTransactionChallenges).values({
      id: challengeId,
      userId: user.id,
      walletId: params.walletId,
      challenge: options.challenge,
      transactionHash,
      expiresAt,
    });

    return { success: true, challengeId, options };
  } catch (error) {
    console.error("requestPasskeyChallenge error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur serveur",
    };
  }
}

export async function verifyPasskeyChallenge(params: {
  challengeId: string;
  assertion: unknown;
  transaction: PasskeyChallengeParams;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return { success: false, error: "Non authentifié" };
    }

    const [challengeRow] = await db
      .select()
      .from(passkeyTransactionChallenges)
      .where(
        and(
          eq(passkeyTransactionChallenges.id, params.challengeId),
          eq(passkeyTransactionChallenges.userId, user.id),
          isNull(passkeyTransactionChallenges.consumedAt),
          gt(passkeyTransactionChallenges.expiresAt, new Date())
        )
      )
      .limit(1)
      .for("update");

    if (!challengeRow) {
      return { success: false, error: "Challenge invalide ou expiré" };
    }

    const expectedHash = computeTransactionHash(params.transaction);
    if (expectedHash !== challengeRow.transactionHash) {
      return { success: false, error: "Paramètres de transaction modifiés" };
    }

    if (challengeRow.walletId !== params.transaction.walletId) {
      return { success: false, error: "Wallet incohérent" };
    }

    const [credential] = await db
      .select()
      .from(passkey)
      .where(eq(passkey.credentialID, (params.assertion as any).id))
      .limit(1);

    if (!credential || credential.userId !== user.id) {
      return { success: false, error: "Credential inconnu" };
    }

    const verification = await verifyAuthenticationResponse({
      response: params.assertion as any,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: credential.credentialID,
        publicKey: Buffer.from(credential.publicKey, "base64url"),
        counter: credential.counter,
        transports: credential.transports
          ? (credential.transports.split(",") as AuthenticatorTransportFuture[])
          : undefined,
      },
      requireUserVerification: false,
    });

    if (!verification.verified) {
      return { success: false, error: "Vérification Passkey échouée" };
    }

    // Consommation atomique : seul le premier appel obtient la ligne non consommée.
    const consumed = await db
      .update(passkeyTransactionChallenges)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(passkeyTransactionChallenges.id, challengeRow.id),
          isNull(passkeyTransactionChallenges.consumedAt)
        )
      )
      .returning({ id: passkeyTransactionChallenges.id });

    if (consumed.length === 0) {
      return { success: false, error: "Challenge déjà utilisé" };
    }

    await db
      .update(passkey)
      .set({ counter: verification.authenticationInfo.newCounter })
      .where(eq(passkey.id, credential.id));

    return { success: true };
  } catch (error) {
    console.error("verifyPasskeyChallenge error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur serveur",
    };
  }
}