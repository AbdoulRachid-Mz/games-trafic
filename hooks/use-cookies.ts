import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  setCookie as setCookieAction,
  getCookie as getCookieAction,
  deleteCookie as deleteCookieAction,
  clearCookiesByPrefix as clearCookiesByPrefixAction,
} from "@/actions/cookies";



// Optimized hook for cookie management with TanStack Query
export function useCookie(name: string) {
  const queryClient = useQueryClient();

  // Query to get cookie value
  const { data: value, refetch } = useQuery({
    queryKey: ["cookie", name],
    queryFn: () => getCookieAction(name),
    staleTime: 0, // Always fresh, cookies can change externally
    refetchOnWindowFocus: true,
  });

  // Mutation to set cookie
  const { mutateAsync: set } = useMutation({
    mutationFn: (params: {
      value: string;
      options?: Parameters<typeof setCookieAction>[2];
    }) => setCookieAction(name, params.value, params.options),
    onSuccess: () => {
      // Invalidate and refetch to sync state
      queryClient.invalidateQueries({ queryKey: ["cookie", name] });
    },
  });

  // Mutation to delete cookie
  const { mutateAsync: remove } = useMutation({
    mutationFn: (path?: string) => deleteCookieAction(name, path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cookie", name] });
    },
  });

  return {
    value,
    set,
    remove,
    refetch,
  };
}

// Hook to manage multiple cookies with a prefix
export function useCookiesByPrefix(prefix: string) {
  const queryClient = useQueryClient();

  // Mutation to clear all cookies with the given prefix
  const { mutateAsync: clearAll } = useMutation({
    mutationFn: () => clearCookiesByPrefixAction(prefix),
    onSuccess: () => {
      // Invalidate all cookie queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["cookie"] });
    },
  });

  return {
    clearAll,
  };
}
