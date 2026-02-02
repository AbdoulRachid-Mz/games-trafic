// hooks/use-notifications.ts
"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
} from "@/actions/notifications";
import type { NotificationFilters } from "@/actions/notifications";

// Key factory for notifications
const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters: NotificationFilters) =>
    [...notificationKeys.lists(), filters] as const,
  infinite: (userId: string, filters?: NotificationFilters) =>
    [...notificationKeys.list(filters || {}), "infinite", userId] as const,
  unread: (userId: string) => [...notificationKeys.all, "unread", userId] as const,
  detail: (id: string) => [...notificationKeys.all, "detail", id] as const,
};

/**
 * Hook optimized for infinite scroll of user notifications
 * Uses stale-while-revalidate, background refetching, and smart cache management
 */
export function useInfiniteNotifications(
  userId: string,
  filters?: NotificationFilters,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useInfiniteQuery({
    queryKey: notificationKeys.infinite(userId, filters),
    queryFn: ({ pageParam = 1 }) =>
      getUserNotifications(userId, { ...filters, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    initialPageParam: 1,
    enabled: options?.enabled !== false && !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    refetchInterval: options?.refetchInterval ?? 1000 * 30, // 30 seconds
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook for unread count with real-time updates
 */
export function useUnreadNotificationCount(
  userId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: notificationKeys.unread(userId),
    queryFn: () => getUnreadCount(userId),
    enabled: options?.enabled !== false && !!userId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // 30 seconds
  });
}

/**
 * Optimistic mutation for marking a notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notificationId,
      userId,
    }: {
      notificationId: string;
      userId: string;
    }) => markNotificationAsRead(notificationId, userId),

    onMutate: async ({ notificationId, userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: notificationKeys.infinite(userId),
      });
      await queryClient.cancelQueries({
        queryKey: notificationKeys.unread(userId),
      });

      // Snapshot previous value
      const previousInfinite = queryClient.getQueryData(
        notificationKeys.infinite(userId)
      );
      const previousUnread = queryClient.getQueryData(
        notificationKeys.unread(userId)
      );

      // Optimistically update infinite list
      queryClient.setQueryData(
        notificationKeys.infinite(userId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              notifications: page.notifications.map((n: any) =>
                n.id === notificationId ? { ...n, read: true } : n
              ),
            })),
          };
        }
      );

      // Optimistically update unread count
      queryClient.setQueryData(
        notificationKeys.unread(userId),
        (old: number) => (old > 0 ? old - 1 : 0)
      );

      return { previousInfinite, previousUnread };
    },

    onError: (err, vars, context) => {
      // Rollback on error
      if (context?.previousInfinite) {
        queryClient.setQueryData(
          notificationKeys.infinite(vars.userId),
          context.previousInfinite
        );
      }
      if (context?.previousUnread !== undefined) {
        queryClient.setQueryData(
          notificationKeys.unread(vars.userId),
          context.previousUnread
        );
      }
    },

    onSettled: (_data, _error, vars) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: notificationKeys.infinite(vars.userId),
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unread(vars.userId),
      });
    },
  });
}

/**
 * Optimistic mutation for marking all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => markAllNotificationsAsRead(userId),

    onMutate: async (userId) => {
      await queryClient.cancelQueries({
        queryKey: notificationKeys.infinite(userId),
      });
      await queryClient.cancelQueries({
        queryKey: notificationKeys.unread(userId),
      });

      const previousInfinite = queryClient.getQueryData(
        notificationKeys.infinite(userId)
      );
      const previousUnread = queryClient.getQueryData(
        notificationKeys.unread(userId)
      );

      // Optimistically mark all as read
      queryClient.setQueryData(
        notificationKeys.infinite(userId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              notifications: page.notifications.map((n: any) => ({
                ...n,
                read: true,
              })),
            })),
          };
        }
      );

      queryClient.setQueryData(notificationKeys.unread(userId), 0);

      return { previousInfinite, previousUnread };
    },

    onError: (_err, userId, context) => {
      if (context?.previousInfinite) {
        queryClient.setQueryData(
          notificationKeys.infinite(userId),
          context.previousInfinite
        );
      }
      if (context?.previousUnread !== undefined) {
        queryClient.setQueryData(
          notificationKeys.unread(userId),
          context.previousUnread
        );
      }
    },

    onSettled: (_data, _error, userId: string) => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.infinite(userId),
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unread(userId),
      });
    },
  });
}

/**
 * Optimistic delete mutation
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notificationId,
      userId,
    }: {
      notificationId: string;
      userId: string;
    }) => deleteNotification(notificationId, userId),

    onMutate: async ({ notificationId, userId }) => {
      await queryClient.cancelQueries({
        queryKey: notificationKeys.infinite(userId),
      });

      const previousInfinite = queryClient.getQueryData(
        notificationKeys.infinite(userId)
      );

      // Optimistically remove from list
      queryClient.setQueryData(
        notificationKeys.infinite(userId),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              notifications: page.notifications.filter(
                (n: any) => n.id !== notificationId
              ),
            })),
          };
        }
      );

      return { previousInfinite };
    },

    onError: (_err, vars, context) => {
      if (context?.previousInfinite) {
        queryClient.setQueryData(
          notificationKeys.infinite(vars.userId),
          context.previousInfinite
        );
      }
    },

    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.infinite(vars.userId),
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unread(vars.userId),
      });
    },
  });
}
