'use server';

import { groups, groupMembers, users, type Group, type NewGroup, type GroupMember, type NewGroupMember, type User } from '@/database/schema';
import { eq, and, or, like, ilike, inArray, desc, asc, sql, count, isNull, gte, lte, notInArray } from 'drizzle-orm';
import { type GroupFilters, type GroupMemberFilters, type ListQuery, type PaginationResponse, type QueryOptions } from '@/types/api';
import { db } from '@/lib/db';
import { createNotification } from '@/actions/notifications';
import { getUserById } from '@/actions/users';
import { revalidatePath } from 'next/cache';

// ============================================================================
// QUERIES - Lecture des données
// ============================================================================

/**
 * Envoie une demande pour rejoindre un groupe privé
 */
export async function requestJoinGroup(groupId: string, userId: string) {
  try {
    const group = await getGroupById(groupId);
    if (!group) throw new Error('Group not found');

    const user = await getUserById(userId);
    if (!user) throw new Error('User not found');

    // Envoyer la notification au créateur du groupe
    await createNotification({
      userId: group.creatorId,
      title: 'Demande d\'adhésion au groupe',
      message: `${user.username || user.fullName} souhaite rejoindre votre groupe "${group.name}".`,
      type: 'GROUP_JOIN_REQUEST',
      linkUrl: `/chats/groups/${groupId}?requestUser=${userId}`,
    });

    return { success: true };
  } catch (error) {
    console.error('Error requesting group join:', error);
    return { success: false, error: 'Failed to send join request' };
  }
}

/**
 * Récupère un groupe par son ID avec relations optionnelles
 */
export async function getGroupById(
  id: string,
  options?: { populate?: string[] }
): Promise<Group | null> {
  try {
    if (options?.populate && options.populate.length > 0) {
      const query = db.query.groups.findFirst({
        where: (groups, { eq }) => eq(groups.id, id),
        with: {
          creator: options.populate.includes('creator') ? true : undefined,
          members: options.populate.includes('members') ? true : undefined,
          messages: options.populate.includes('messages') ? true : undefined,
        }
      });
      return (await query) ?? null;
    }

    const result = await db
      .select()
      .from(groups)
      .where(eq(groups.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting group by ID:', error);
    throw new Error('Failed to fetch group');
  }
}

/**
 * Récupère un groupe par son nom
 */
export async function getGroupByName(name: string): Promise<Group | null> {
  try {
    const result = await db
      .select()
      .from(groups)
      .where(eq(groups.name, name))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting group by name:', error);
    throw new Error('Failed to fetch group');
  }
}

/**
 * Liste les groupes avec pagination, filtres et options
 */
export async function getGroups(
  query: ListQuery<GroupFilters> = {}
): Promise<PaginationResponse<Group>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = buildGroupWhereConditions(filters, options);

    const groupsQuery = db
      .select()
      .from(groups)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset);

    if (options.sortBy) {
      const sortField = options.sortBy as keyof Group;
      const sortOrder = options.sortOrder === 'desc' ? desc : asc;
      groupsQuery.orderBy(sortOrder(groups[sortField]));
    } else {
      groupsQuery.orderBy(desc(groups.createdAt));
    }

    const countQuery = db
      .select({ count: count() })
      .from(groups)
      .where(whereConditions);

    const [groupsData, totalResult] = await Promise.all([groupsQuery, countQuery]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: groupsData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      }
    };
  } catch (error) {
    console.error('Error getting groups:', error);
    throw new Error('Failed to fetch groups');
  }
}

/**
 * Récupère les groupes d'un utilisateur (créés ou auxquels il appartient)
 */
export async function getUserGroups(
  userId: string,
  query: ListQuery<GroupFilters> = {}
): Promise<PaginationResponse<Group>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    // Récupérer les IDs des groupes où l'utilisateur est membre
    const memberGroups = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));

    const memberGroupIds = memberGroups.map(m => m.groupId);

    const whereConditions = and(
      buildGroupWhereConditions(filters, options),
      or(
        eq(groups.creatorId, userId),
        inArray(groups.id, memberGroupIds)
      )
    );

    const groupsQuery = db
      .select()
      .from(groups)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset)
      .orderBy(desc(groups.createdAt));

    const countQuery = db
      .select({ count: count() })
      .from(groups)
      .where(whereConditions);

    const [groupsData, totalResult] = await Promise.all([groupsQuery, countQuery]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: groupsData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      }
    };
  } catch (error) {
    console.error('Error getting user groups:', error);
    throw new Error('Failed to fetch user groups');
  }
}

/**
 * Récupère les statistiques des groupes
 */
export async function getGroupStats(filters?: GroupFilters) {
  try {
    const whereConditions = buildGroupWhereConditions(filters || {});

    const [totalResult, privateResult, publicResult] = await Promise.all([
      db.select({ count: count() }).from(groups).where(whereConditions),
      db.select({ count: count() }).from(groups).where(and(whereConditions, eq(groups.isPrivate, true))),
      db.select({ count: count() }).from(groups).where(and(whereConditions, eq(groups.isPrivate, false)))
    ]);

    return {
      total: totalResult[0]?.count ?? 0,
      private: privateResult[0]?.count ?? 0,
      public: publicResult[0]?.count ?? 0
    };
  } catch (error) {
    console.error('Error getting group stats:', error);
    throw new Error('Failed to fetch group statistics');
  }
}

// ============================================================================
// GROUP MEMBERS - Gestion des membres
// ============================================================================

/**
 * Recherche des utilisateurs pour les ajouter à un groupe
 */
export async function searchUsersForGroup(query: string, limit = 10): Promise<User[]> {
  try {
    if (!query || query.length < 2) return [];
    
    const searchTerm = `%${query}%`;
    
    const result = await db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.username, searchTerm),
          ilike(users.fullName, searchTerm),
          ilike(users.email, searchTerm),
          ilike(users.phoneNumber, searchTerm)
        )
      )
      .limit(limit);

    return result;
  } catch (error) {
    console.error('Error searching users for group:', error);
    return [];
  }
}

/**
 * Récupère un membre de groupe par ID
 */
export async function getGroupMemberById(id: string): Promise<GroupMember | null> {
  try {
    const result = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting group member by ID:', error);
    throw new Error('Failed to fetch group member');
  }
}

/**
 * Récupère l'appartenance d'un utilisateur à un groupe spécifique
 */
export async function getGroupMemberByUserAndGroup(
  userId: string,
  groupId: string
): Promise<GroupMember | null> {
  try {
    const result = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.userId, userId), eq(groupMembers.groupId, groupId)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting group member by user and group:', error);
    throw new Error('Failed to fetch group member');
  }
}

/**
 * Liste les membres d'un groupe
 */
export async function getGroupMembers(
  groupId: string,
  query: ListQuery<GroupMemberFilters> = {}
): Promise<PaginationResponse<GroupMember>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = and(
      eq(groupMembers.groupId, groupId),
      buildGroupMemberWhereConditions(filters, options)
    );

    const membersData = await db.query.groupMembers.findMany({
      where: (gm, { eq, and }) =>
        and(eq(gm.groupId, groupId), buildGroupMemberWhereConditions(filters, options)),
      limit: pagination.limit,
      offset,
      orderBy: (gm, { desc, asc }) => {
        if (options.sortBy) {
          const sortOrder = options.sortOrder === "desc" ? desc : asc;
          return [sortOrder(gm[options.sortBy as keyof typeof gm] as any)];
        }
        return [asc(gm.joinedAt)];
      },
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            fullName: true,
            profileImage: true,
          },
        },
      },
    });

    const countQuery = db
      .select({ count: count() })
      .from(groupMembers)
      .where(whereConditions);

    const [totalResult] = await Promise.all([countQuery]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: membersData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      }
    };
  } catch (error) {
    console.error('Error getting group members:', error);
    throw new Error('Failed to fetch group members');
  }
}

/**
 * Liste les groupes auxquels un utilisateur appartient
 */
export async function getUserGroupMemberships(
  userId: string,
  query: ListQuery<GroupMemberFilters> = {}
): Promise<PaginationResponse<GroupMember>> {
  try {
    const { pagination = { page: 1, limit: 50 }, filters = {}, options = {} } = query;
    const offset = (pagination.page - 1) * pagination.limit;

    const whereConditions = and(
      eq(groupMembers.userId, userId),
      buildGroupMemberWhereConditions(filters, options)
    );

    const membershipsQuery = db
      .select()
      .from(groupMembers)
      .where(whereConditions)
      .limit(pagination.limit)
      .offset(offset)
      .orderBy(desc(groupMembers.joinedAt));

    const countQuery = db
      .select({ count: count() })
      .from(groupMembers)
      .where(whereConditions);

    const [membershipsData, totalResult] = await Promise.all([membershipsQuery, countQuery]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: membershipsData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      }
    };
  } catch (error) {
    console.error('Error getting user group memberships:', error);
    throw new Error('Failed to fetch user group memberships');
  }
}

/**
 * Récupère les statistiques des membres d'un groupe
 */
export async function getGroupMemberStats(groupId: string) {
  try {
    const whereConditions = eq(groupMembers.groupId, groupId);

    const [totalResult, ownerResult, adminResult, memberResult] = await Promise.all([
      db.select({ count: count() }).from(groupMembers).where(whereConditions),
      db.select({ count: count() }).from(groupMembers).where(and(whereConditions, eq(groupMembers.role, 'OWNER'))),
      db.select({ count: count() }).from(groupMembers).where(and(whereConditions, eq(groupMembers.role, 'ADMIN'))),
      db.select({ count: count() }).from(groupMembers).where(and(whereConditions, eq(groupMembers.role, 'MEMBER')))
    ]);

    return {
      total: totalResult[0]?.count ?? 0,
      owners: ownerResult[0]?.count ?? 0,
      admins: adminResult[0]?.count ?? 0,
      members: memberResult[0]?.count ?? 0
    };
  } catch (error) {
    console.error('Error getting group member stats:', error);
    throw new Error('Failed to fetch group member statistics');
  }
}

// ============================================================================
// MUTATIONS - Écriture des données
// ============================================================================

/**
 * Crée un nouveau groupe
 */
export async function createGroup(groupData: NewGroup): Promise<Group> {
  try {
    if (!groupData.creatorId || !groupData.name) {
      throw new Error('creatorId and name are required');
    }

    // Vérification des doublons de nom
    const existingGroup = await getGroupByName(groupData.name);
    if (existingGroup) {
      throw new Error('Group with this name already exists');
    }

    const result = await db
      .insert(groups)
      .values({
        ...groupData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const createdGroup = result[0];

    // Ajouter automatiquement le créateur comme OWNER
    await addGroupMember(createdGroup.id, groupData.creatorId, 'OWNER');

    return createdGroup;
  } catch (error) {
    console.error('Error creating group:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create group');
  }
}

/**
 * Met à jour un groupe
 */
export async function updateGroup(
  id: string,
  groupData: Partial<NewGroup>
): Promise<Group> {
  try {
    // Vérification que le groupe existe
    const existingGroup = await getGroupById(id);
    if (!existingGroup) {
      throw new Error('Group not found');
    }

    // Vérification des doublons de nom si le nom est modifié
    if (groupData.name && groupData.name !== existingGroup.name) {
      const groupWithName = await getGroupByName(groupData.name);
      if (groupWithName) {
        throw new Error('Group name already exists');
      }
    }

    const result = await db
      .update(groups)
      .set({
        ...groupData,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error updating group:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update group');
  }
}

/**
 * Supprime un groupe (soft delete via cascade)
 */
export async function deleteGroup(id: string): Promise<Group> {
  try {
    const result = await db
      .delete(groups)
      .where(eq(groups.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error('Group not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error deleting group:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete group');
  }
}

/**
 * Ajoute un membre à un groupe
 */
export async function addGroupMember(
  groupId: string,
  userId: string,
  role: 'OWNER' | 'ADMIN' | 'MEMBER' = 'MEMBER'
): Promise<GroupMember> {
  try {
    // Vérification que le groupe existe
    const group = await getGroupById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Vérification que l'utilisateur n'est pas déjà membre
    const existingMember = await getGroupMemberByUserAndGroup(userId, groupId);
    if (existingMember) {
      throw new Error('User is already a member of this group');
    }

    const result = await db
      .insert(groupMembers)
      .values({
        groupId,
        userId,
        role,
        joinedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath(`/chats/groups/${groupId}`);
    
    return result[0];
  } catch (error) {
    console.error('Error adding group member:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to add group member');
  }
}

/**
 * Met à jour le rôle d'un membre du groupe
 */
export async function updateGroupMemberRole(
  memberId: string,
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
): Promise<GroupMember> {
  try {
    const result = await db
      .update(groupMembers)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(groupMembers.id, memberId))
      .returning();

    if (result.length === 0) {
      throw new Error('Group member not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error updating group member role:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update group member role');
  }
}

/**
 * Retire un membre du groupe
 */
export async function removeGroupMember(memberId: string): Promise<GroupMember> {
  try {
    const result = await db
      .delete(groupMembers)
      .where(eq(groupMembers.id, memberId))
      .returning();

    if (result.length === 0) {
      throw new Error('Group member not found');
    }

    return result[0];
  } catch (error) {
    console.error('Error removing group member:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to remove group member');
  }
}

/**
 * Quitte un groupe (pour l'utilisateur courant)
 */
export async function leaveGroup(userId: string, groupId: string): Promise<GroupMember> {
  try {
    const member = await getGroupMemberByUserAndGroup(userId, groupId);
    if (!member) {
      throw new Error('You are not a member of this group');
    }

    // Vérifier que ce n'est pas le dernier OWNER
    if (member.role === 'OWNER') {
      const ownerCount = await db
        .select({ count: count() })
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.role, 'OWNER')));

      if (ownerCount[0]?.count === 1) {
        throw new Error('Cannot leave group: you are the last owner');
      }
    }

    return await removeGroupMember(member.id);
  } catch (error) {
    console.error('Error leaving group:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to leave group');
  }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Construit les conditions WHERE pour les requêtes groups
 */
function buildGroupWhereConditions(
  filters: GroupFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  // Filtres de base
  if (!options.includeDeleted) {
    // groups n'a pas de champ isDeleted, donc on ne filtre pas
  }

  // Filtres spécifiques
  if (filters.id) {
    conditions.push(eq(groups.id, filters.id));
  }
  if (filters.creatorId) {
    conditions.push(eq(groups.creatorId, filters.creatorId));
  }
  if (filters.name) {
    conditions.push(ilike(groups.name, `%${filters.name}%`));
  }
  if (typeof filters.isPrivate === 'boolean') {
    conditions.push(eq(groups.isPrivate, filters.isPrivate));
  }

  // Filtres de date
  if (filters.createdFrom) {
    conditions.push(gte(groups.createdAt, new Date(filters.createdFrom)));
  }
  if (filters.createdTo) {
    conditions.push(lte(groups.createdAt, new Date(filters.createdTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Construit les conditions WHERE pour les requêtes groupMembers
 */
function buildGroupMemberWhereConditions(
  filters: GroupMemberFilters,
  options: QueryOptions = {}
) {
  const conditions = [];

  // Filtres de base
  if (!options.includeDeleted) {
    // groupMembers n'a pas de champ isDeleted
  }

  // Filtres spécifiques
  if (filters.id) {
    conditions.push(eq(groupMembers.id, filters.id));
  }
  if (filters.groupId) {
    conditions.push(eq(groupMembers.groupId, filters.groupId));
  }
  if (filters.userId) {
    conditions.push(eq(groupMembers.userId, filters.userId));
  }
  if (filters.roles && filters.roles.length > 0) {
    conditions.push(inArray(groupMembers.role, filters.roles));
  }

  // Filtres de date
  if (filters.joinedFrom) {
    conditions.push(gte(groupMembers.joinedAt, new Date(filters.joinedFrom)));
  }
  if (filters.joinedTo) {
    conditions.push(lte(groupMembers.joinedAt, new Date(filters.joinedTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Vérifie si un utilisateur a la permission d'effectuer une action sur un groupe
 */
export async function checkGroupPermission(
  userId: string,
  groupId: string,
  requiredRole: 'OWNER' | 'ADMIN' | 'MEMBER'
): Promise<boolean> {
  try {
    const member = await getGroupMemberByUserAndGroup(userId, groupId);
    if (!member) return false;

    const roleHierarchy = { OWNER: 3, ADMIN: 2, MEMBER: 1 };
    const userRoleLevel = roleHierarchy[member.role as keyof typeof roleHierarchy];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    return userRoleLevel >= requiredRoleLevel;
  } catch (error) {
    console.error('Error checking group permission:', error);
    return false;
  }
}
