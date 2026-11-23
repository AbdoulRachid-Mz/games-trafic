/**
 * Canal Web Push (VAPID) — Games Trafics
 * Utilise la librairie web-push pour l'envoi standardisé avec authentification VAPID
 */

import { setVapidDetails, sendNotification, generateVAPIDKeys } from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/database/schema";
import { eq } from "drizzle-orm";
import type { SendResult } from "../types";

// ─── Configuration VAPID ──────────────────────────────────────────────────────

let _vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (_vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? `mailto:${process.env.RESEND_FROM_EMAIL ?? "admin@games-trafics.com"}`;

  if (!publicKey || !privateKey) {
    console.warn("[Push] VAPID keys absentes — push non configuré.");
    return false;
  }

  setVapidDetails(subject, publicKey, privateKey);
  _vapidConfigured = true;
  return true;
}

// ─── Payload Push ─────────────────────────────────────────────────────────────

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  notificationId?: string;
  type?: string;
  actions?: { action: string; title: string; icon?: string }[];
}

// ─── Envoi push à un utilisateur ─────────────────────────────────────────────

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<SendResult> {
  if (!ensureVapidConfigured()) {
    return { success: false, error: "VAPID non configuré" };
  }

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (!subs.length) {
    return { success: true, id: "no-subscriptions" };
  }

  const payloadStr = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? "/icons/gt-primary.png",
    badge: payload.badge ?? "/icons/icon-badge-72.png",
    image: payload.image,
    data: {
      url: payload.url ?? "/notifications",
      notificationId: payload.notificationId,
      type: payload.type,
    },
    actions: payload.actions,
  });

  let sent = 0;
  const errors: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payloadStr
        );
        sent++;
      } catch (err: unknown) {
        // Supprimer les abonnements expirés ou invalides
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id))
            .catch(console.error);
        }
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(msg);
        console.warn("[Push] Erreur pour sub", sub.id, ":", msg);
      }
    })
  );

  if (sent === 0 && errors.length > 0) {
    return { success: false, error: errors[0] };
  }

  return { success: true, id: `sent:${sent}` };
}

// ─── Génération des clés VAPID ────────────────────────────────────────────────

/**
 * Utilitaire pour générer une paire de clés VAPID.
 * À n'exécuter qu'une seule fois pour initialiser les env vars.
 * Sortie : { publicKey, privateKey }
 */
export function generateVapidKeys() {
  return generateVAPIDKeys();
}
