/**
 * Dispatcher central de notifications — Games Trafics
 * Orchestre l'envoi vers tous les canaux selon les préférences utilisateur.
 */

import { db } from "@/lib/db";
import { users, notifications } from "@/database/schema";
import { eq } from "drizzle-orm";

import { sendEmail } from "./channels/email";
import { sendWhatsAppText } from "./channels/whatsapp";
import { sendPushToUser } from "./channels/push";
import { renderTemplate } from "./templates";

import type {
  NotificationEvent,
  NotificationChannel,
  ChannelResult,
  DispatchResult,
  UserNotificationPreferences,
  NotificationEventType,
} from "./types";

// ─── Résolution des préférences utilisateur ───────────────────────────────────

async function getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      email: true,
      phoneNumber: true,
      settings: true,
    },
  });

  if (!user) {
    return { in_app: false, email: false, whatsapp: false, push: false };
  }

  const userSettings = (user.settings as Record<string, any>) ?? {};
  const notifSettings = (userSettings.notifications as Record<string, any>) ?? {};

  // Par défaut, in_app, email et push sont activés si l'utilisateur a les identifiants
  const inAppEnabled = notifSettings.in_app !== false;
  const emailEnabled = notifSettings.email !== false && Boolean(user.email);
  const whatsappEnabled = notifSettings.whatsapp === true && Boolean(user.phoneNumber ?? notifSettings.whatsappPhone);
  const pushEnabled = notifSettings.push !== false;

  return {
    in_app: inAppEnabled,
    email: emailEnabled,
    whatsapp: whatsappEnabled,
    push: pushEnabled,
    whatsappPhone: (notifSettings.whatsappPhone as string | undefined) ?? user.phoneNumber ?? undefined,
    emailOverride: (notifSettings.emailOverride as string | undefined) ?? user.email ?? undefined,
  };
}

// ─── Création de la notification in-app ───────────────────────────────────────

async function createInAppNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  linkUrl?: string,
  meta?: { shopId?: string; tournamentId?: string }
): Promise<string | undefined> {
  try {
    const [created] = await db
      .insert(notifications)
      .values({
        userId,
        title,
        message,
        type,
        linkUrl,
        shopId: meta?.shopId,
        tournamentId: meta?.tournamentId,
        read: false,
        isActive: true,
        isDeleted: false,
        createdAt: new Date(),
      })
      .returning({ id: notifications.id });

    return created?.id;
  } catch (err) {
    console.error("[Dispatcher] Erreur création notification in-app :", err);
    return undefined;
  }
}

// ─── Statut global du système externe ────────────────────────────────────────

export function areExternalNotificationsEnabled(): boolean {
  return process.env.ENABLE_EXTERNAL_NOTIFICATIONS === "true";
}

// ─── Dispatcher principal ─────────────────────────────────────────────────────

export async function dispatchNotification<T extends NotificationEventType>(
  event: NotificationEvent<Record<string, unknown>> & { type: T }
): Promise<DispatchResult> {
  const { userId, type, data, channels: forcedChannels } = event;

  // 1. Résoudre les préférences
  const prefs = await getUserPreferences(userId);

  const requestedChannels: NotificationChannel[] = forcedChannels ?? [
    "in_app",
    "email",
    "whatsapp",
    "push",
  ];

  // Vérification de l'interrupteur global : si désactivé, seules les
  // notifications internes ("in_app") sont exécutées.
  const externalEnabled = areExternalNotificationsEnabled();

  const results: ChannelResult[] = [];

  // Filtrer les canaux autorisés et notifier les canaux désactivés
  const activeChannels: NotificationChannel[] = [];
  for (const ch of requestedChannels) {
    if (ch === "in_app") {
      activeChannels.push(ch);
    } else if (externalEnabled) {
      activeChannels.push(ch);
    } else {
      results.push({
        channel: ch,
        success: false,
        error: "Notifications externes désactivées (ENABLE_EXTERNAL_NOTIFICATIONS=false)",
      });
    }
  }

  // 2. Rendre le template
  const template = renderTemplate(type, data as any);

  let notificationId: string | undefined;

  // 3. Envoi par canal
  await Promise.allSettled(
    activeChannels.map(async (channel) => {
      switch (channel) {
        // ── In-app ────────────────────────────────────────────────────────────
        case "in_app": {
          if (!prefs.in_app) {
            results.push({ channel, success: false, error: "Désactivé par l'utilisateur" });
            return;
          }

          const id = await createInAppNotification(
            userId,
            template.title,
            template.body,
            type,
            template.linkUrl,
            {
              tournamentId: (data.tournamentId as string | undefined),
              shopId: (data.shopId as string | undefined),
            }
          );
          notificationId = id;
          results.push({ channel, success: Boolean(id) });
          break;
        }

        // ── Email ─────────────────────────────────────────────────────────────
        case "email": {
          if (!prefs.email || !prefs.emailOverride) {
            results.push({ channel, success: false, error: "Email non configuré ou désactivé" });
            return;
          }

          const result = await sendEmail({
            to: prefs.emailOverride,
            subject: template.title,
            html: template.emailHtml,
            text: template.body,
          });
          results.push({ channel, ...result });
          break;
        }

        // ── WhatsApp ──────────────────────────────────────────────────────────
        case "whatsapp": {
          if (!prefs.whatsapp || !prefs.whatsappPhone) {
            results.push({ channel, success: false, error: "WhatsApp non configuré ou désactivé" });
            return;
          }

          const waText = `*${template.title}*\n\n${template.body}${template.linkUrl ? `\n\n🔗 ${template.linkUrl}` : ""}`;
          const result = await sendWhatsAppText(prefs.whatsappPhone, waText);
          results.push({ channel, ...result });
          break;
        }

        // ── Web Push ──────────────────────────────────────────────────────────
        case "push": {
          if (!prefs.push) {
            results.push({ channel, success: false, error: "Push désactivé par l'utilisateur" });
            return;
          }

          const result = await sendPushToUser(userId, {
            title: template.title,
            body: template.body,
            url: template.linkUrl,
            notificationId,
            type,
          });
          results.push({ channel, ...result });
          break;
        }
      }
    })
  );

  const success = results.some((r) => r.success);

  return { success, results, notificationId };
}

// ─── Helpers de dispatch rapide ───────────────────────────────────────────────

/**
 * Dispatche uniquement in-app (cas où email/WA ne sont pas nécessaires)
 */
export async function notifyInApp(
  userId: string,
  type: NotificationEventType,
  data: Record<string, unknown>
): Promise<DispatchResult> {
  return dispatchNotification({
    userId,
    type,
    data,
    channels: ["in_app"],
  });
}

/**
 * Dispatche tous les canaux actifs de l'utilisateur
 */
export async function notifyUser(
  userId: string,
  type: NotificationEventType,
  data: Record<string, unknown>
): Promise<DispatchResult> {
  return dispatchNotification({ userId, type, data });
}

/**
 * Dispatche à plusieurs utilisateurs en parallèle
 */
export async function notifyUsers(
  userIds: string[],
  type: NotificationEventType,
  data: Record<string, unknown>
): Promise<DispatchResult[]> {
  return Promise.all(userIds.map((userId) => notifyUser(userId, type, data)));
}
