"use server";

import {
  messages,
  type Message,
  type NewMessage,
  users,
  groups,
  shops,
  posts,
  products,
  MessageWithRelations,
} from "@/database/schema";
import {
  eq,
  and,
  or,
  like,
  ilike,
  inArray,
  desc,
  asc,
  sql,
  count,
  isNull,
  isNotNull,
  gte,
  lte,
  between,
} from "drizzle-orm";
import {
  type MessageFilters,
  type ListQuery,
  type PaginationResponse,
  type QueryOptions,
} from "@/types/api";
import { db } from "@/lib/db";

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Récupère un message par son ID avec relations optionnelles
 */
export async function getMessageById(
  id: string,
  options?: { populate?: string[] },
): Promise<Message | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.messages.findFirst({
        where: (messages, { eq }) => eq(messages.id, id),
        with: {
          sender: options.populate.includes("sender") ? true : undefined,
          recipient: options.populate.includes("recipient") ? true : undefined,
          group: options.populate.includes("group") ? true : undefined,
          shop: options.populate.includes("shop") ? true : undefined,
          post: options.populate.includes("post") ? true : undefined,
          product: options.populate.includes("product") ? true : undefined,
          parentMessage: options.populate.includes("parentMessage")
            ? true
            : undefined,
          replies: options.populate.includes("replies") ? true : undefined,
        },
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error getting message by ID:", error);
    throw new Error("Failed to fetch message");
  }
}

/**
 * Liste les messages avec pagination, filtres et options
 */
export async function getMessages(
  query: ListQuery<MessageFilters> = {},
): Promise<PaginationResponse<MessageWithRelations>> {
  try {
    const {
      pagination = { page: 1, limit: 50 },
      filters = {},
      options = {},
    } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildMessageWhereConditions(filters, options);

    const messagesQuery = db
      .select()
      .from(messages)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof Message;
      const sortOrder = options.sortOrder === "desc" ? desc : asc;
      messagesQuery.orderBy(sortOrder(messages[sortField]));
    } else {
      messagesQuery.orderBy(desc(messages.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(messages)
      .where(whereConditions);

    const [messagesData, totalResult] = await Promise.all([
      messagesQuery,
      countQuery,
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: messagesData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting messages:", error);
    throw new Error("Failed to fetch messages");
  }
}

/**
 * Récupère les messages d'une conversation entre deux utilisateurs
 */
export async function getConversation(
  userId1: string,
  userId2: string,
  pagination?: { page: number; limit: number },
): Promise<PaginationResponse<Message>> {
  try {
    const { page = 1, limit = 50 } = pagination || {};
    const offset = (page - 1) * limit;

    const whereConditions = and(
      eq(messages.isDeleted, false),
      or(
        and(eq(messages.senderId, userId1), eq(messages.recipientId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1)),
      ),
    );

    const [messagesData, totalResult] = await Promise.all([
      db
        .select()
        .from(messages)
        .where(whereConditions)
        .orderBy(desc(messages.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(messages).where(whereConditions),
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: messagesData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting conversation:", error);
    throw new Error("Failed to fetch conversation");
  }
}

/**
 * Récupère les messages d'un groupe
 */
export async function getGroupMessages(
  groupId: string,
  pagination?: { page: number; limit: number },
): Promise<PaginationResponse<Message>> {
  try {
    const { page = 1, limit = 50 } = pagination || {};
    const offset = (page - 1) * limit;

    const whereConditions = and(
      eq(messages.groupId, groupId),
      eq(messages.isDeleted, false),
    );

    const [messagesData, totalResult] = await Promise.all([
      db
        .select()
        .from(messages)
        .where(whereConditions)
        .orderBy(desc(messages.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(messages).where(whereConditions),
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: messagesData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting group messages:", error);
    throw new Error("Failed to fetch group messages");
  }
}

/**
 * Récupère les messages non lus d'un utilisateur
 */
export async function getUnreadMessages(userId: string): Promise<Message[]> {
  try {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.recipientId, userId),
          eq(messages.read, false),
          eq(messages.isDeleted, false),
        ),
      )
      .orderBy(desc(messages.createdAt));
  } catch (error) {
    console.error("Error getting unread messages:", error);
    throw new Error("Failed to fetch unread messages");
  }
}

/**
 * Compte les messages non lus d'un utilisateur
 */
export async function countUnreadMessages(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(messages)
      .where(
        and(
          eq(messages.recipientId, userId),
          eq(messages.read, false),
          eq(messages.isDeleted, false),
        ),
      );
    return result[0]?.count || 0;
  } catch (error) {
    console.error("Error counting unread messages:", error);
    throw new Error("Failed to count unread messages");
  }
}

/**
 * Récupère les statistiques des messages
 */
export async function getMessageStats(filters?: MessageFilters) {
  try {
    const whereConditions = buildMessageWhereConditions(filters || {});

    const [
      totalResult,
      readResult,
      unreadResult,
      withImagesResult,
      withAudioResult,
      groupMessagesResult,
      privateMessagesResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(messages).where(whereConditions),
      db
        .select({ count: count() })
        .from(messages)
        .where(and(whereConditions, eq(messages.read, true))),
      db
        .select({ count: count() })
        .from(messages)
        .where(and(whereConditions, eq(messages.read, false))),
      db
        .select({ count: count() })
        .from(messages)
        .where(and(whereConditions, isNotNull(messages.images))),
      db
        .select({ count: count() })
        .from(messages)
        .where(and(whereConditions, isNotNull(messages.audioUrl))),
      db
        .select({ count: count() })
        .from(messages)
        .where(and(whereConditions, isNotNull(messages.groupId))),
      db
        .select({ count: count() })
        .from(messages)
        .where(
          and(
            whereConditions,
            isNull(messages.groupId),
            isNotNull(messages.recipientId),
          ),
        ),
    ]);

    const stats = {
      total: totalResult[0]?.count ?? 0,
      read: readResult[0]?.count ?? 0,
      unread: unreadResult[0]?.count ?? 0,
      withImages: withImagesResult[0]?.count ?? 0,
      withAudio: withAudioResult[0]?.count ?? 0,
      groupMessages: groupMessagesResult[0]?.count ?? 0,
      privateMessages: privateMessagesResult[0]?.count ?? 0,
    };

    return stats;
  } catch (error) {
    console.error("Error getting message stats:", error);
    throw new Error("Failed to fetch message statistics");
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée un nouveau message
 */
export async function createMessage(messageData: NewMessage): Promise<Message> {
  try {
    // Validation des données requises
    if (!messageData.senderId) {
      throw new Error("senderId is required");
    }

    // --- CORRECTION DU BLOC DE VALIDATION CI-DESSOUS ---

    // Déterminer le type de message
    const isDirectMessage = !!messageData.recipientId;
    const isGroupMessage = !!messageData.groupId;
    // Un commentaire est lié à une entité (Post, Produit, etc.)
    const isComment = !!messageData.entityId && !!messageData.entityType;

    // La validation échoue si ce n'est ni un DM, ni un message de groupe, ni un commentaire valide
    if (!isDirectMessage && !isGroupMessage && !isComment) {
      throw new Error(
        "A message must be either sent to a recipient, a group, or linked to an entity (comment)",
      );
    }

    // On s'assure qu'on ne mélange pas DM et Groupe (logique existante)
    if (isGroupMessage && isDirectMessage) {
      throw new Error("Cannot specify both groupId and recipientId");
    }

    // ---------------------------------------------------

    const result = await db
      .insert(messages)
      .values({
        ...messageData,
        createdAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating message:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create message");
  }
}

/**
 * Met à jour un message
 */
export async function updateMessage(
  id: string,
  messageData: Partial<NewMessage>,
): Promise<Message> {
  try {
    // Vérification que le message existe
    const existingMessage = await getMessageById(id);
    if (!existingMessage) {
      throw new Error("Message not found");
    }

    const result = await db
      .update(messages)
      .set({
        ...messageData,
      })
      .where(eq(messages.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error updating message:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update message");
  }
}

/**
 * Supprime un message (soft delete)
 */
export async function deleteMessage(id: string): Promise<Message> {
  try {
    const result = await db
      .update(messages)
      .set({
        isDeleted: true,
        isActive: false,
      })
      .where(eq(messages.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Message not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error deleting message:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete message");
  }
}

/**
 * Restaure un message supprimé
 */
export async function restoreMessage(id: string): Promise<Message> {
  try {
    const result = await db
      .update(messages)
      .set({
        isDeleted: false,
        isActive: true,
      })
      .where(eq(messages.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Message not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error restoring message:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to restore message");
  }
}

/**
 * Marque un message comme lu
 */
export async function markMessageAsRead(id: string): Promise<Message> {
  try {
    const result = await db
      .update(messages)
      .set({
        read: true,
      })
      .where(eq(messages.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Message not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw new Error("Failed to mark message as read");
  }
}

/**
 * Marque plusieurs messages comme lus
 */
export async function markMessagesAsRead(
  messageIds: string[],
): Promise<number> {
  try {
    const result = await db
      .update(messages)
      .set({
        read: true,
      })
      .where(inArray(messages.id, messageIds))
      .returning();

    return result.length;
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw new Error("Failed to mark messages as read");
  }
}

/**
 * Crée une réponse à un message
 */
export async function replyToMessage(
  parentMessageId: string,
  replyData: Omit<NewMessage, "parentMessageId">,
): Promise<Message> {
  try {
    // Vérification que le message parent existe
    const parentMessage = await getMessageById(parentMessageId);
    if (!parentMessage) {
      throw new Error("Parent message not found");
    }

    return await createMessage({
      ...replyData,
      parentMessageId,
    });
  } catch (error) {
    console.error("Error replying to message:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create reply");
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes messages
 */
function buildMessageWhereConditions(
  filters: MessageFilters,
  options: QueryOptions = {},
) {
  const conditions = [];

  // Filtres de base
  if (!options.includeDeleted) {
    conditions.push(eq(messages.isDeleted, false));
  }

  if (!options.includeInactive) {
    conditions.push(eq(messages.isActive, true));
  }

  // Filtres spécifiques
  if (filters.senderId) {
    conditions.push(eq(messages.senderId, filters.senderId));
  }

  if (filters.recipientId) {
    conditions.push(eq(messages.recipientId, filters.recipientId));
  }

  if (filters.groupId) {
    conditions.push(eq(messages.groupId, filters.groupId));
  }

  if (filters.shopId) {
    conditions.push(eq(messages.shopId, filters.shopId));
  }

  if (filters.postId) {
    conditions.push(eq(messages.postId, filters.postId));
  }

  if (filters.productId) {
    conditions.push(eq(messages.productId, filters.productId));
  }

  if (filters.userId) {
    conditions.push(eq(messages.userId, filters.userId));
  }

  if (filters.entityId) {
    conditions.push(eq(messages.entityId, filters.entityId));
  }

  if (filters.entityType && filters.entityType.length > 0) {
    const validTypes = Array.isArray(filters.entityType) ? filters.entityType : [filters.entityType];
    conditions.push(inArray(messages.entityType, validTypes));
  }

  if (filters.content) {
    conditions.push(ilike(messages.content, `%${filters.content}%`));
  }

  if (typeof filters.isRead === "boolean") {
    conditions.push(eq(messages.read, filters.isRead));
  }

  if (typeof filters.hasImages === "boolean") {
    conditions.push(
      filters.hasImages ? isNotNull(messages.images) : isNull(messages.images),
    );
  }

  if (typeof filters.hasAudio === "boolean") {
    conditions.push(
      filters.hasAudio
        ? isNotNull(messages.audioUrl)
        : isNull(messages.audioUrl),
    );
  }

  if (filters.parentMessageId) {
    conditions.push(eq(messages.parentMessageId, filters.parentMessageId));
  }

  if (typeof filters.isOpenToPublic === "boolean") {
    conditions.push(eq(messages.isOpenToPublic, filters.isOpenToPublic));
  }

  // Filtres de date
  if (filters.createdFrom) {
    conditions.push(gte(messages.createdAt, new Date(filters.createdFrom)));
  }

  if (filters.createdTo) {
    conditions.push(lte(messages.createdAt, new Date(filters.createdTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
