import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGroupById,
  getGroups,
  getUserGroups,
  getGroupStats,
  createGroup,
  updateGroup,
  deleteGroup,
  addGroupMember,
  updateGroupMemberRole,
  removeGroupMember,
  leaveGroup,
  getGroupMembers,
  getGroupMemberByUserAndGroup,
  getGroupMemberStats,
  checkGroupPermission,
  requestJoinGroup,
} from '@/actions/groups';
import type { Group, GroupMember, NewGroup } from '@/database/schema';
import type { GroupFilters, GroupMemberFilters, ListQuery, PaginationResponse } from '@/types/api';

// Query keys factory
const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: (filters: GroupFilters | undefined) => [...groupKeys.lists(), filters] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string | undefined) => [...groupKeys.details(), id] as const,
  userGroups: (userId: string) => [...groupKeys.all, 'user', userId] as const,
  stats: () => [...groupKeys.all, 'stats'] as const,
  members: (groupId: string) => [...groupKeys.all, 'members', groupId] as const,
  member: (memberId: string) => [...groupKeys.all, 'member', memberId] as const,
  membership: (userId: string, groupId: string) => [...groupKeys.all, 'membership', userId, groupId] as const,
  permission: (userId: string, groupId: string, role: string) => [...groupKeys.all, 'permission', userId, groupId, role] as const,
};

// ============================
// Query Hooks
// ============================

export function useGroupById(id: string | undefined, options?: { populate?: string[] }) {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: () => (id ? getGroupById(id, options) : null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGroups(query: ListQuery<GroupFilters> = {}) {
  return useQuery<PaginationResponse<Group>>({
    queryKey: groupKeys.list(query.filters),
    queryFn: () => getGroups(query),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useUserGroups(userId: string, query: ListQuery<GroupFilters> = {}) {
  return useQuery<PaginationResponse<Group>>({
    queryKey: groupKeys.userGroups(userId),
    queryFn: () => getUserGroups(userId, query),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useGroupStats(filters?: GroupFilters) {
  return useQuery({
    queryKey: groupKeys.stats(),
    queryFn: () => getGroupStats(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useGroupMembers(groupId: string, query: ListQuery<GroupMemberFilters> = {}) {
  return useQuery<PaginationResponse<GroupMember>>({
    queryKey: groupKeys.members(groupId),
    queryFn: () => getGroupMembers(groupId, query),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useGroupMemberByUserAndGroup(userId: string | undefined, groupId: string | undefined) {
  return useQuery<GroupMember | null>({
    queryKey: groupKeys.membership(userId || '', groupId || ''),
    queryFn: () => (userId && groupId ? getGroupMemberByUserAndGroup(userId, groupId) : null),
    enabled: !!userId && !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGroupMemberStats(groupId: string) {
  return useQuery({
    queryKey: [...groupKeys.members(groupId), 'stats'],
    queryFn: () => getGroupMemberStats(groupId),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCheckGroupPermission(userId: string | undefined, groupId: string | undefined, requiredRole: 'OWNER' | 'ADMIN' | 'MEMBER') {
  return useQuery<boolean>({
    queryKey: groupKeys.permission(userId || '', groupId || '', requiredRole),
    queryFn: () => (userId && groupId ? checkGroupPermission(userId, groupId, requiredRole) : false),
    enabled: !!userId && !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================
// Mutation Hooks
// ============================

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewGroup) => createGroup(data),
    onSuccess: (newGroup) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.userGroups(newGroup.creatorId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.stats() });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId, data }: { id: string; userId: string; data: Partial<NewGroup> }) => updateGroup(id, userId, data),
    onSuccess: (updatedGroup) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(updatedGroup.id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.userGroups(updatedGroup.creatorId) });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.removeQueries({ queryKey: groupKeys.detail(id) });
    },
  });
}

export function useAddGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId, role, addedBy }: { groupId: string; userId: string; role?: 'OWNER' | 'ADMIN' | 'MEMBER'; addedBy?: string }) =>
      addGroupMember(groupId, userId, role, addedBy),
    onSuccess: (_, { groupId, userId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.membership(userId, groupId) });
      queryClient.invalidateQueries({ queryKey: [...groupKeys.members(groupId), 'stats'] });
    },
  });
}

export function useUpdateGroupMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role, updatedBy }: { memberId: string; role: 'OWNER' | 'ADMIN' | 'MEMBER'; updatedBy?: string }) =>
      updateGroupMemberRole(memberId, role, updatedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useRemoveGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, removedBy }: { memberId: string; removedBy?: string }) => removeGroupMember(memberId, removedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, groupId }: { userId: string; groupId: string }) => leaveGroup(userId, groupId),
    onSuccess: (_, { userId, groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.userGroups(userId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.membership(userId, groupId) });
      queryClient.invalidateQueries({ queryKey: [...groupKeys.members(groupId), 'stats'] });
    },
  });
}
export function useRequestJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      requestJoinGroup(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}
