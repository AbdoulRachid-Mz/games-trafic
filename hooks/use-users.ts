import { useQuery } from '@tanstack/react-query';
import { getUserById, getUsers } from '@/actions/users';
import type { UserFilters, ListQuery, PaginationResponse } from '@/types/api';
import type { User } from '@/database/schema';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters | undefined) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string | undefined) => [...userKeys.details(), id] as const,
};

export function useUserById(id: string | undefined, options?: { populate?: string[] }) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => (id ? getUserById(id, options) : null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUsers(query: ListQuery<UserFilters> = {}) {
  return useQuery<PaginationResponse<User>>({
    queryKey: userKeys.list(query.filters),
    queryFn: () => getUsers(query),
    staleTime: 5 * 60 * 1000,
  });
}
