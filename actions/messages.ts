"use server";

import { getCurrentUser } from '@/lib/auth/session';
import {
  messages,
  type Message,
  type NewMessage,
  users,
  groups,
  groupMembers,
  shops,
  posts,
  products,
  MessageWithRelations,
  EntityType,
  conversations,
} from "@/database/schema";
import { type Conversation, type ChatId } from "@/types/chat";
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
          gameClip: options.populate.includes("gameClip") ? true : undefined,
          edition: options.populate.includes("edition") ? true : undefined,
          tournament: options.populate.includes("tournament") ? true : undefined,
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
 * Récupère les conversations d'un utilisateur
 */
export async function getConversationsForUser(
  userId: string,
): Promise<Conversation[]> {
  try {
    // 1. Trouver toutes les conversations où l'utilisateur est participant
    const userConversationsRaw = await db.query.conversations.findMany({
      where: (c, { sql }) => sql`${c.participantIds} @> ARRAY[${userId}]::text[]`,
      orderBy: (c, { desc }) => [desc(c.updatedAt)],
    });

    // Optimisation: récupérer les messages et utilisateurs séparément pour éviter les JOIN LATERAL massifs
    const lastMessageIds = userConversationsRaw
      .map(c => c.lastMessageId)
      .filter(Boolean) as string[];

    let lastMessagesMap = new Map<string, any>();
    if (lastMessageIds.length > 0) {
      const messagesData = await db.query.messages.findMany({
        where: (m, { inArray }) => inArray(m.id, lastMessageIds),
      });

      const senderIds = messagesData.map(m => m.senderId).filter(Boolean) as string[];
      let sendersMap = new Map<string, any>();
      if (senderIds.length > 0) {
        const sendersData = await db.query.users.findMany({
          where: (u, { inArray }) => inArray(u.id, senderIds),
          columns: {
            id: true,
            username: true,
            fullName: true,
            profileImage: true,
          },
        });
        sendersData.forEach(s => sendersMap.set(s.id, s));
      }

      messagesData.forEach(m => {
        lastMessagesMap.set(m.id, {
          ...m,
          sender: m.senderId ? sendersMap.get(m.senderId) : null,
        });
      });
    }

    const userConversations = userConversationsRaw.map(conv => ({
      ...conv,
      lastMessage: conv.lastMessageId ? lastMessagesMap.get(conv.lastMessageId) : null,
    }));

    // 2. Enrichir chaque conversation avec les données de l'entité cible
    const enrichedConversations = await Promise.all(
      userConversations.map(async (conv) => {
        let entityType = conv.entityType.toLowerCase() as any;
        let entityId = conv.entityId;
        let entityData: any = null;

        // Pour un DM, l'entité cible est l'AUTRE participant
        if (conv.entityType === "USER") {
          const otherParticipantId = conv.participantIds.find((id) => id !== userId);
          if (otherParticipantId) {
            entityId = otherParticipantId;
            entityData = await db.query.users.findFirst({
              where: (u, { eq }) => eq(u.id, otherParticipantId),
              columns: {
                id: true,
                username: true,
                fullName: true,
                profileImage: true,
              },
            });
          }
        } else if (conv.entityType === "GROUP") {
          entityData = await db.query.groups.findFirst({
            where: (g, { eq }) => eq(g.id, conv.entityId),
          });
        } else if (conv.entityType === "SHOP") {
          entityData = await db.query.shops.findFirst({
            where: (s, { eq }) => eq(s.id, conv.entityId),
          });
        } else if (conv.entityType === "TOURNAMENT") {
          entityData = await db.query.tournaments.findFirst({
            where: (t, { eq }) => eq(t.id, conv.entityId),
          });
        }

        // Si l'entité n'est plus trouvée, on utilise des placeholders
        if (!entityData) {
          entityData = { id: entityId, name: "Deleted Entity", fullName: "Deleted User" };
        }

        return {
          id: conv.id,
          chatId: `${entityType}:${entityId}` as any,
          entityType: entityType,
          entityId: entityId,
          entity: {
            type: entityType,
            data: entityData,
          },
          lastMessage: conv.lastMessage as any,
          lastMessageTime: conv.updatedAt ? conv.updatedAt.toISOString() : null,
          unreadCount: conv.unreadCount || 0,
          isPinned: conv.isPinned || false,
          isMuted: conv.isMuted || false,
          isArchived: conv.isArchived || false,
          metadata: conv.metadata || {},
        } as Conversation;
      }),
    );

    return enrichedConversations;
  } catch (error) {
    console.error("Error getting conversations:", error);
    return [];
  }
}

/**
 * Récupère les commentaires d'une entité avec relations (auteurs, réponses)
 */
export async function getEntityComments(
  entityId: string,
  entityType: EntityType,
  pagination: { page: number; limit: number } = { page: 1, limit: 20 },
): Promise<PaginationResponse<MessageWithRelations>> {
  try {
    const offset = (pagination.page - 1) * pagination.limit;

    const data = await db.query.messages.findMany({
      where: (m, { and, or, eq, isNull }) =>
        and(
          or(
            and(eq(m.entityId, entityId), eq(m.entityType, entityType)),
            // Fallback for specific columns
            entityType.toUpperCase() === "PRODUCT" ? eq(m.productId, entityId) : undefined,
            entityType.toUpperCase() === "SHOP" ? eq(m.shopId, entityId) : undefined,
            entityType.toUpperCase() === "POST" ? eq(m.postId, entityId) : undefined,
            entityType.toUpperCase() === "TOURNAMENT" ? eq(m.tournamentId, entityId) : undefined,
            entityType.toUpperCase() === "EDITION" ? eq(m.editionId, entityId) : undefined,
            entityType.toUpperCase() === "USER" ? eq(m.userId, entityId) : undefined,
            entityType.toUpperCase() === "GAMECLIP" ? eq(m.gameClipId, entityId) : undefined,
            entityType.toUpperCase() === "GROUP" ? eq(m.groupId, entityId) : undefined,
          ),
          isNull(m.parentMessageId),
          eq(m.isDeleted, false),
        ),
      orderBy: (m, { desc }) => [desc(m.createdAt)],
      limit: pagination.limit,
      offset,
      with: {
        sender: {
          columns: {
            id: true,
            username: true,
            fullName: true,
            profileImage: true,
          },
        },
        replies: {
          with: {
            sender: {
              columns: {
                id: true,
                username: true,
                fullName: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    const totalRes = await db
      .select({ count: count() })
      .from(messages)
      .where(
        and(
          eq(messages.entityId, entityId),
          eq(messages.entityType, entityType),
          isNull(messages.parentMessageId),
          eq(messages.isDeleted, false),
        ),
      );

    const total = totalRes[0].count;

    return {
      data: data as any,
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
    console.error("Error getting entity comments:", error);
    throw new Error("Failed to fetch comments");
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
          sql`NOT (${userId} = ANY(${messages.readBy}))`,
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
          sql`NOT (${userId} = ANY(${messages.readBy}))`,
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
        .where(and(whereConditions, sql`cardinality(${messages.readBy}) > 0`)),
      db
        .select({ count: count() })
        .from(messages)
        .where(and(whereConditions, or(isNull(messages.readBy), sql`cardinality(${messages.readBy}) = 0`))),
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
    // SEC-08 FIX: senderId is always sourced from the authenticated session,
    // never from client-supplied input — prevents message sender identity spoofing.
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Non authentifié');

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

    // senderId is always the authenticated user — strip any client-provided value
    const { senderId: _ignoredSenderId, ...restMessageData } = messageData;
    
    // Auto-populate specific ID columns based on entityType/entityId
    const finalData = { ...restMessageData, senderId: currentUser.id };
    if (messageData.entityType && messageData.entityId) {
      const type = messageData.entityType.toUpperCase();
      const id = messageData.entityId;
      
      if (type === 'PRODUCT') finalData.productId = id;
      else if (type === 'SHOP') finalData.shopId = id;
      else if (type === 'POST') finalData.postId = id;
      else if (type === 'TOURNAMENT') finalData.tournamentId = id;
      else if (type === 'EDITION') finalData.editionId = id;
      else if (type === 'USER') finalData.userId = id;
      else if (type === 'GAMECLIP') finalData.gameClipId = id;
      else if (type === 'GROUP') finalData.groupId = id;
    }

    const result = await db
      .insert(messages)
      .values({
        ...finalData,
        createdAt: new Date(),
      })
      .returning();

    const newMessage = result[0];

    // --- UPSERT CONVERSATION ---
    let convChatId: string;
    let convEntityType: any;
    let convEntityId: string;
    let participantIds: string[] = [newMessage.senderId];

    if (newMessage.groupId) {
      convChatId = `group:${newMessage.groupId}`;
      convEntityType = "GROUP";
      convEntityId = newMessage.groupId;
      // For groups, we could fetch all members, but for now we'll rely on the logic that
      // anyone in the group will find this conversation via entityId or participant check
      const members = await db.query.groupMembers.findMany({
        where: (gm, { eq }) => eq(gm.groupId, newMessage.groupId!),
      });
      participantIds = members.map((m) => m.userId);
    } else if (newMessage.recipientId) {
      const ids = [newMessage.senderId, newMessage.recipientId].sort();
      convChatId = `dm:${ids.join("-")}`;
      convEntityType = "USER";
      convEntityId = newMessage.recipientId; // This is arbitrary for shared conv
      participantIds = ids;
    } else {
      convEntityType = newMessage.entityType || "USER";
      convEntityId = newMessage.entityId || newMessage.recipientId || "";
      convChatId = `${convEntityType}:${convEntityId}`;
      if (newMessage.recipientId) participantIds.push(newMessage.recipientId);
    }

    await db
      .insert(conversations)
      .values({
        chatId: convChatId,
        participantIds,
        entityType: convEntityType,
        entityId: convEntityId,
        lastMessageId: newMessage.id,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: conversations.chatId,
        set: {
          lastMessageId: newMessage.id,
          updatedAt: new Date(),
          // Increment unread count logic could be added here
          // For now, we'll just update the timestamp
        },
      });

    return newMessage;
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
    // SEC-08 FIX: Only the message sender or an admin can edit a message
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Non authentifié');
    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;

    // Vérification que le message existe
    const existingMessage = await getMessageById(id);
    if (!existingMessage) {
      throw new Error("Message not found");
    }

    if (!isAdmin && existingMessage.senderId !== currentUser.id) {
      throw new Error('Accès refusé — vous ne pouvez modifier que vos propres messages');
    }

    // Strip sender/recipient fields from editable data
    const { senderId: _s, recipientId: _r, ...safeMessageData } = messageData as any;

    const result = await db
      .update(messages)
      .set({ ...safeMessageData })
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
 * SEC-08 FIX: Sender or admin only
 */
export async function deleteMessage(id: string): Promise<Message> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Non authentifié');
    const isAdmin = currentUser.role === 'admin' || (currentUser as any).isAdmin === true;

    const existing = await getMessageById(id);
    if (!existing) throw new Error('Message not found');
    if (!isAdmin && existing.senderId !== currentUser.id) {
      throw new Error('Accès refusé — vous ne pouvez supprimer que vos propres messages');
    }

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
export async function markMessageAsRead(
  id: string,
  userId: string,
): Promise<Message> {
  try {
    const result = await db
      .update(messages)
      .set({
        readBy: sql`CASE WHEN ${userId} = ANY(${messages.readBy}) THEN ${messages.readBy} ELSE array_append(${messages.readBy}, ${userId}) END`,
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
  userId: string,
): Promise<number> {
  try {
    const result = await db
      .update(messages)
      .set({
        readBy: sql`CASE WHEN ${userId} = ANY(${messages.readBy}) THEN ${messages.readBy} ELSE array_append(${messages.readBy}, ${userId}) END`,
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
 * Marque toute une conversation comme lue pour un utilisateur
 */
export async function markConversationAsRead(
  chatId: string,
  userId: string,
): Promise<void> {
  try {
    // 1. Trouver tous les messages de cette conversation (basé sur l'entité)
    const [type, id] = chatId.split(":");
    
    let whereClause: any;
    if (type === "group") {
      whereClause = eq(messages.groupId, id);
    } else if (type === "user") {
      // Pour les DMs, on cherche les messages entre les deux participants
      // C'est un peu complexe sans un ID de conversation sur le message, 
      // mais on peut utiliser recipientId/senderId
      whereClause = or(
        and(eq(messages.senderId, userId), eq(messages.recipientId, id)),
        and(eq(messages.senderId, id), eq(messages.recipientId, userId))
      );
    } else {
      whereClause = and(
        eq(messages.entityType, type.toUpperCase() as any),
        eq(messages.entityId, id)
      );
    }

    await db
      .update(messages)
      .set({
        readBy: sql`CASE WHEN ${userId} = ANY(${messages.readBy}) THEN ${messages.readBy} ELSE array_append(${messages.readBy}, ${userId}) END`,
      })
      .where(and(whereClause, sql`NOT (${userId} = ANY(${messages.readBy}))`));

    // 2. Mettre à jour le compteur de la conversation si nécessaire
    // TODO: Si on stocke un unreadCount par utilisateur dans une table pivot, le mettre à 0 ici
  } catch (error) {
    console.error("Error marking conversation as read:", error);
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
    if (filters.isRead) {
      conditions.push(sql`cardinality(${messages.readBy}) > 0`);
    } else {
      conditions.push(or(isNull(messages.readBy), sql`cardinality(${messages.readBy}) = 0`));
    }
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
