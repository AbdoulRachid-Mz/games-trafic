// lib/actions/notifications.ts
"use server";

import { db } from "@/lib/db";
import {
  notifications,
  pushSubscriptions,
  users,
  shops,
} from "@/database/schema";
import { eq, and, desc, sql, inArray, ilike, gte, lte, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  type ListQuery,
  type PaginationResponse,
  type QueryOptions,
} from "@/types/api";

export type NotificationFilters = {
  search?: string;
  userId?: string;
  shopId?: string;
  tournamentId?: string;
  type?: string[];
  read?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  createdFrom?: string | Date;
  createdTo?: string | Date;
};

/**
 * Récupère les notifications d'un utilisateur
 */
/**
 * Récupère les notifications d'un utilisateur
 */
/**
 * Liste les notifications pour l'admin avec pagination et filtres
 */
export async function getNotifications(
  query: ListQuery<NotificationFilters> = {}
): Promise<PaginationResponse<typeof notifications.$inferSelect>> {
  try {
    const {
      pagination = { page: 1, limit: 20 },
      filters = {},
      options = {},
    } = query;

    const offset = (pagination.page - 1) * pagination.limit;

    // Conditions
    const conditions = [];

    if (filters.search) {
      conditions.push(ilike(notifications.title, `%${filters.search}%`));
    }
    if (filters.userId)
      conditions.push(eq(notifications.userId, filters.userId));
    if (filters.shopId)
      conditions.push(eq(notifications.shopId, filters.shopId));
    if (filters.type && filters.type.length > 0)
      conditions.push(inArray(notifications.type, filters.type));
    if (typeof filters.read === "boolean")
      conditions.push(eq(notifications.read, filters.read));
    if (typeof filters.isActive === "boolean")
      conditions.push(eq(notifications.isActive, filters.isActive));
    if (typeof filters.isDeleted === "boolean")
      conditions.push(eq(notifications.isDeleted, filters.isDeleted));

    if (filters.createdFrom)
      conditions.push(
        gte(notifications.createdAt, new Date(filters.createdFrom))
      );
    if (filters.createdTo)
      conditions.push(
        lte(notifications.createdAt, new Date(filters.createdTo))
      );

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Query Data
    const dataQuery = db.query.notifications.findMany({
      where: whereClause,
      limit: pagination.limit,
      offset: offset,
      orderBy: (notifications, { desc, asc }) => [
        options.sortBy
          ? options.sortOrder === "asc"
            ? asc((notifications as any)[options.sortBy])
            : desc((notifications as any)[options.sortBy])
          : desc(notifications.createdAt),
      ],
      with: {
        user: true,
        shop: true,
      },
    });

    // Query Count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(whereClause);

    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    const total = Number(totalResult[0]?.count || 0);

    return {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNext: pagination.page < Math.ceil(total / pagination.limit),
        hasPrev: pagination.page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting notifications:", error);
    throw new Error("Failed to fetch notifications");
  }
}

/**
 * Récupère les notifications d'un utilisateur
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    types?: string[];
    shopId?: string;
    tournamentId?: string;
  }
) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    let whereConditions = and(
      eq(notifications.userId, userId),
      eq(notifications.isActive, true),
      eq(notifications.isDeleted, false)
    );

    if (options?.unreadOnly) {
      whereConditions = and(whereConditions, eq(notifications.read, false));
    }

    if (options?.types && options.types.length > 0) {
      whereConditions = and(
        whereConditions,
        inArray(notifications.type, options.types)
      );
    }

    if (options?.shopId) {
      whereConditions = and(
        whereConditions,
        eq(notifications.shopId, options.shopId)
      );
    }

    if (options?.tournamentId) {
      whereConditions = and(
        whereConditions,
        eq(notifications.tournamentId, options.tournamentId)
      );
    }

    const notificationsData = await db
      .select()
      .from(notifications)
      .where(whereConditions)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    // Count pour la pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(whereConditions);

    const total = countResult[0]?.count || 0;

    return {
      notifications: notificationsData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return {
      notifications: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  try {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();

    if (!updatedNotification) {
      return { success: false, error: "Notification not found" };
    }

    revalidatePath("/notifications");
    return { success: true, data: updatedNotification };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

/**
 * Récupère le nombre de notifications non lues pour un utilisateur
 * Alias de getUnreadNotificationsCount pour compatibilité
 */
export async function getUnreadCount(userId: string) {
  return getUnreadNotificationsCount(userId);
}

/**
 * Récupère une notification par son ID
 */
export async function getNotificationById(id: string) {
  try {
    const notification = await db.query.notifications.findFirst({
      where: (notifications, { eq }) => eq(notifications.id, id),
      with: {
        user: true,
        shop: true,
        tournament: true,
      },
    });

    return notification || null;
  } catch (error) {
    console.error("Error getting notification by ID:", error);
    throw new Error("Failed to fetch notification");
  }
}


/**
 * Marque toutes les notifications comme lues
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const result = await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false),
          eq(notifications.isActive, true),
          eq(notifications.isDeleted, false)
        )
      )
      .returning();

    revalidatePath("/notifications");
    return { success: true, count: result.length };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: "Failed to mark notifications as read" };
  }
}

/**
 * Supprime une notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
) {
  try {
    const [deletedNotification] = await db
      .update(notifications)
      .set({ isDeleted: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();

    if (!deletedNotification) {
      return { success: false, error: "Notification not found" };
    }

    revalidatePath("/notifications");
    return { success: true, data: deletedNotification };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { success: false, error: "Failed to delete notification" };
  }
}

/**
 * Met à jour une notification
 */
export async function updateNotification(
  id: string,
  notificationData: Partial<typeof notifications.$inferInsert>
) {
  try {
    const [updatedNotification] = await db
      .update(notifications)
      .set({
        ...notificationData,
        updatedAt: new Date(),
      })
      .where(eq(notifications.id, id))
      .returning();

    revalidatePath("/admin/notifications");
    return { success: true, data: updatedNotification };
  } catch (error) {
    console.error("Error updating notification:", error);
    return { success: false, error: "Failed to update notification" };
  }
}

/**
 * Supprime plusieurs notifications
 */
export async function deleteNotifications(
  notificationIds: string[],
  userId: string
) {
  try {
    const result = await db
      .update(notifications)
      .set({ isDeleted: true })
      .where(
        and(
          inArray(notifications.id, notificationIds),
          eq(notifications.userId, userId)
        )
      )
      .returning();

    revalidatePath("/notifications");
    return { success: true, count: result.length };
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return { success: false, error: "Failed to delete notifications" };
  }
}

/**
 * Crée une nouvelle notification
 */
export async function createNotification(notificationData: {
  userId: string;
  title: string;
  message: string;
  type: string;
  linkUrl?: string;
  shopId?: string;
  tournamentId?: string;
}) {
  try {
    const [newNotification] = await db
      .insert(notifications)
      .values({
        ...notificationData,
        read: false,
        isActive: true,
        isDeleted: false,
        createdAt: new Date(),
      })
      .returning();

    return { success: true, data: newNotification };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

/**
 * Récupère le nombre de notifications non lues
 */
export async function getUnreadNotificationsCount(userId: string) {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false),
          eq(notifications.isActive, true),
          eq(notifications.isDeleted, false)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error("Error fetching unread notifications count:", error);
    return 0;
  }
}

/**
 * Envoie une notification push via les abonnements stockés
 */
export async function sendPushNotification(
  userId: string,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    data?: Record<string, any>;
    actions?: { action: string; title: string }[];
  }
) {
  try {
    const { sendPushToUser } = await import("@/lib/notifications");
    const result = await sendPushToUser(userId, {
      title: payload.title,
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      image: payload.image,
      actions: payload.actions,
      notificationId: payload.data?.notificationId,
      url: payload.data?.linkUrl,
      type: payload.data?.type,
    });

    return { success: result.success, sent: result.success ? 1 : 0 };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, error: "Failed to send push notification" };
  }
}

/**
 * Crée une notification et envoie aussi la push si possible
 */
export async function createNotificationWithPush(notificationData: {
  userId: string;
  title: string;
  message: string;
  type: string;
  linkUrl?: string;
  shopId?: string;
  tournamentId?: string;
  pushPayload?: {
    icon?: string;
    badge?: string;
    image?: string;
    data?: Record<string, any>;
    actions?: { action: string; title: string }[];
  };
}) {
  try {
    // 1. Créer la notification en base
    const [newNotification] = await db
      .insert(notifications)
      .values({
        ...notificationData,
        read: false,
        isActive: true,
        isDeleted: false,
        createdAt: new Date(),
      })
      .returning();

    // 2. Envoyer la push en parallèle (ne bloque pas la réponse)
    if (notificationData.pushPayload) {
      // Pas await ici pour ne pas bloquer la réponse HTTP
      sendPushNotification(notificationData.userId, {
        title: notificationData.title,
        body: notificationData.message,
        ...notificationData.pushPayload,
        data: {
          ...notificationData.pushPayload.data,
          notificationId: newNotification.id,
          type: notificationData.type,
          linkUrl: notificationData.linkUrl,
        },
      }).catch((err) => console.error("Background push failed:", err));
    }

    return { success: true, data: newNotification };
  } catch (error) {
    console.error("Error creating notification with push:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

/**
 * Supprime un abonnement push
 */
export async function deletePushSubscription(endpoint: string) {
  try {
    const result = await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
    return { success: true };
  } catch (error) {
    console.error("Error deleting push subscription:", error);
    return { success: false, error: "Failed to delete push subscription" };
  }
}

/**
 * Enregistre un nouvel abonnement push
 */
export async function subscribeToPush(
  userId: string,
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }
) {
  try {
    // On upsert pour éviter les doublons sur le même endpoint
    const [sub] = await db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      })
      .returning();

    return { success: true, data: sub };
  } catch (error) {
    console.error("Error subscribing to push:", error);
    return { success: false, error: "Failed to subscribe to push" };
  }
}

/**
 * Récupère les préférences de notification d'un utilisateur
 */
export async function getUserNotificationPreferencesAction(userId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        email: true,
        phoneNumber: true,
        settings: true,
      },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    const userSettings = (user.settings as Record<string, any>) ?? {};
    const notifSettings = (userSettings.notifications as Record<string, any>) ?? {};

    return {
      success: true,
      data: {
        in_app: notifSettings.in_app !== false,
        email: notifSettings.email !== false,
        whatsapp: notifSettings.whatsapp === true,
        push: notifSettings.push !== false,
        whatsappPhone: (notifSettings.whatsappPhone as string) || user.phoneNumber || "",
        emailOverride: (notifSettings.emailOverride as string) || user.email || "",
      },
    };
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    return { success: false, error: "Erreur lors de la récupération des préférences" };
  }
}

/**
 * Met à jour les préférences de notification d'un utilisateur
 */
export async function updateUserNotificationPreferencesAction(
  userId: string,
  preferences: {
    in_app?: boolean;
    email?: boolean;
    whatsapp?: boolean;
    push?: boolean;
    whatsappPhone?: string;
    emailOverride?: string;
  }
) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { settings: true },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    const currentSettings = (user.settings as Record<string, any>) ?? {};
    const currentNotifications = (currentSettings.notifications as Record<string, any>) ?? {};

    const updatedSettings = {
      ...currentSettings,
      notifications: {
        ...currentNotifications,
        ...preferences,
      },
    };

    await db
      .update(users)
      .set({
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true, data: updatedSettings.notifications };
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return { success: false, error: "Erreur lors de la mise à jour des préférences" };
  }
}

/**
 * Envoie une notification de test à l'utilisateur
 */
export async function sendTestNotificationAction(
  userId: string,
  channel: "in_app" | "email" | "whatsapp" | "push"
) {
  try {
    const { dispatchNotification, areExternalNotificationsEnabled } =
      await import("@/lib/notifications");

    if (channel !== "in_app" && !areExternalNotificationsEnabled()) {
      return {
        success: false,
        error:
          "Les notifications externes sont désactivées. Définissez ENABLE_EXTERNAL_NOTIFICATIONS=true dans votre .env pour les activer.",
      };
    }

    const result = await dispatchNotification({
      userId,
      type: "admin_announcement",
      channels: [channel],
      data: {
        title: `Test de notification (${channel.toUpperCase()})`,
        message: `Ceci est un message de test envoyé depuis Games Trafics via le canal ${channel}. Votre configuration fonctionne parfaitement !`,
      },
    });

    const channelResult = result.results.find((r) => r.channel === channel);
    if (channelResult && !channelResult.success && channelResult.error) {
      return { success: false, error: channelResult.error };
    }

    return { success: result.success, results: result.results };
  } catch (error: any) {
    console.error("Error sending test notification:", error);
    return {
      success: false,
      error: error?.message || "Échec de l'envoi de la notification de test",
    };
  }
}

